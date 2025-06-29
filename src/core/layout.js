import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { ThemeManager } from './theme.js';

export class LayoutEngine {
  constructor(config, themeManager) {
    this.config = config;
    this.themeManager = themeManager || new ThemeManager(config);
    this.layoutCache = new Map();
    this.componentCache = new Map();
  }

  // 获取布局内容
  getLayout(layoutName, data = {}) {
    const cacheKey = `${this.themeManager.currentTheme}_${layoutName}`;
    
    if (this.layoutCache.has(cacheKey)) {
      return this.processLayout(this.layoutCache.get(cacheKey), data);
    }

    const layouts = this.themeManager.getThemeLayouts();
    
    if (!layouts[layoutName]) {
      throw new Error(`布局 "${layoutName}" 不存在`);
    }

    try {
      const layoutContent = readFileSync(layouts[layoutName], 'utf8');
      this.layoutCache.set(cacheKey, layoutContent);
      return this.processLayout(layoutContent, data);
    } catch (error) {
      throw new Error(`读取布局文件失败: ${error.message}`);
    }
  }

  // 处理布局内容
  processLayout(layoutContent, data) {
    let processedContent = layoutContent;

    // 处理变量替换
    processedContent = this.processVariables(processedContent, data);
    
    // 处理组件引用
    processedContent = this.processComponents(processedContent);
    
    // 处理主题配置
    processedContent = this.processThemeConfig(processedContent);

    return processedContent;
  }

  // 处理变量替换
  processVariables(content, data) {
    let processed = content;

    // 处理基本数据变量
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      processed = processed.replace(regex, String(value || ''));
    }

    // 处理站点配置变量
    for (const [key, value] of Object.entries(this.config)) {
      const regex = new RegExp(`\\$\\{site\\.${key}\\}`, 'g');
      processed = processed.replace(regex, String(value || ''));
    }

    // 处理主题配置变量
    const themeConfig = this.themeManager.getThemeConfig();
    this.processNestedVariables(processed, themeConfig, 'theme');

    return processed;
  }

  // 处理嵌套变量
  processNestedVariables(content, obj, prefix) {
    let processed = content;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        processed = this.processNestedVariables(processed, value, `${prefix}.${key}`);
      } else {
        const regex = new RegExp(`\\$\\{${prefix}\\.${key}\\}`, 'g');
        processed = processed.replace(regex, String(value || ''));
      }
    }

    return processed;
  }

  // 处理组件引用
  processComponents(content) {
    // 匹配 <Component name="ComponentName" props={...} />
    const componentRegex = /<Component\s+name="([^"]+)"(\s+props=\{([^}]*)\})?\s*\/>/g;
    
    return content.replace(componentRegex, (match, componentName, propsMatch, propsString) => {
      try {
        const componentContent = this.getComponent(componentName);
        
        if (propsString) {
          // 解析属性并应用到组件
          const props = this.parseProps(propsString);
          return this.processVariables(componentContent, props);
        }
        
        return componentContent;
      } catch (error) {
        console.warn(`⚠️  加载组件 "${componentName}" 失败: ${error.message}`);
        return `<!-- 组件 "${componentName}" 加载失败 -->`;
      }
    });
  }

  // 获取组件内容
  getComponent(componentName) {
    const cacheKey = `${this.themeManager.currentTheme}_${componentName}`;
    
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey);
    }

    const components = this.themeManager.getThemeComponents();
    
    if (!components[componentName]) {
      throw new Error(`组件 "${componentName}" 不存在`);
    }

    try {
      const componentContent = readFileSync(components[componentName], 'utf8');
      this.componentCache.set(cacheKey, componentContent);
      return componentContent;
    } catch (error) {
      throw new Error(`读取组件文件失败: ${error.message}`);
    }
  }

  // 解析属性字符串
  parseProps(propsString) {
    const props = {};
    
    try {
      // 简单的属性解析，支持字符串和数字
      const pairs = propsString.split(',').map(p => p.trim());
      
      for (const pair of pairs) {
        const [key, value] = pair.split(':').map(p => p.trim());
        
        if (key && value) {
          // 移除引号
          const cleanKey = key.replace(/['"]/g, '');
          let cleanValue = value.replace(/['"]/g, '');
          
          // 类型转换
          if (cleanValue === 'true') cleanValue = true;
          else if (cleanValue === 'false') cleanValue = false;
          else if (cleanValue.match(/^\d+$/)) cleanValue = parseInt(cleanValue);
          else if (cleanValue.match(/^\d+\.\d+$/)) cleanValue = parseFloat(cleanValue);
          
          props[cleanKey] = cleanValue;
        }
      }
    } catch (error) {
      console.warn(`⚠️  解析组件属性失败: ${error.message}`);
    }

    return props;
  }

  // 处理主题配置
  processThemeConfig(content) {
    const themeConfig = this.themeManager.getThemeConfig();
    
    // 将主题配置注入到 Astro 脚本中
    const configScript = this.generateConfigScript(themeConfig);
    
    // 在 ---...--- 脚本块中插入配置
    const scriptRegex = /^---\s*\n([\s\S]*?)\n---/m;
    
    if (scriptRegex.test(content)) {
      return content.replace(scriptRegex, (match, scriptContent) => {
        return `---\n${configScript}\n${scriptContent}\n---`;
      });
    } else {
      // 如果没有脚本块，在开头添加
      return `---\n${configScript}\n---\n${content}`;
    }
  }

  // 生成配置脚本
  generateConfigScript(themeConfig) {
    const configLines = [
      '// 主题配置 (自动生成)',
      `const themeConfig = ${JSON.stringify(themeConfig, null, 2)};`,
      'const theme = themeConfig;'
    ];

    // 添加站点配置
    configLines.push(`const siteConfig = ${JSON.stringify(this.config, null, 2)};`);
    configLines.push('const site = siteConfig;');

    return configLines.join('\n');
  }

  // 应用主题样式
  injectStyles(htmlContent) {
    const styles = this.themeManager.getThemeStyles();
    
    if (styles.length === 0) {
      return htmlContent;
    }

    const styleLinks = styles.map(stylePath => {
      const relativePath = relative(process.cwd(), stylePath);
      const webPath = '/' + relativePath.replace(/\\/g, '/');
      
      if (stylePath.endsWith('.css')) {
        return `<link rel="stylesheet" href="${webPath}">`;
      } else if (stylePath.endsWith('.scss')) {
        // 对于 SCSS，我们假设已经编译为 CSS
        const cssPath = webPath.replace('.scss', '.css');
        return `<link rel="stylesheet" href="${cssPath}">`;
      }
      
      return '';
    }).filter(Boolean);

    // 在 </head> 标签前插入样式链接
    if (htmlContent.includes('</head>')) {
      return htmlContent.replace('</head>', `${styleLinks.join('\n')}\n</head>`);
    }

    return htmlContent;
  }

  // 创建 Astro 配置集成
  createAstroIntegration() {
    const themeManager = this.themeManager;
    
    return {
      name: 'plumar-theme',
      hooks: {
        'astro:config:setup': ({ config, injectRoute, addWatchFile }) => {
          // 监听主题文件变化
          const themePath = themeManager.getCurrentThemePath();
          if (existsSync(themePath)) {
            addWatchFile(join(themePath, '**/*'));
          }

          // 添加主题组件目录到 Astro 解析路径
          const components = themeManager.getThemeComponents();
          for (const [name, path] of Object.entries(components)) {
            config.vite.resolve.alias[`@theme/${name}`] = path;
          }

          // 添加主题样式到 Vite
          const styles = themeManager.getThemeStyles();
          if (styles.length > 0) {
            config.vite.css = config.vite.css || {};
            config.vite.css.preprocessorOptions = config.vite.css.preprocessorOptions || {};
            config.vite.css.preprocessorOptions.scss = config.vite.css.preprocessorOptions.scss || {};
            config.vite.css.preprocessorOptions.scss.additionalData = styles
              .filter(s => s.endsWith('.scss'))
              .map(s => `@import "${s}";`)
              .join('\n');
          }
        }
      }
    };
  }

  // 生成布局导入语句
  generateLayoutImports(targetPath) {
    const layouts = this.themeManager.getThemeLayouts();
    const imports = [];

    for (const [layoutName, layoutPath] of Object.entries(layouts)) {
      const relativePath = relative(dirname(targetPath), layoutPath);
      const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      
      imports.push(`import ${layoutName}Layout from '${importPath.replace(/\\/g, '/')}';`);
    }

    return imports.join('\n');
  }

  // 生成组件导入语句
  generateComponentImports(targetPath) {
    const components = this.themeManager.getThemeComponents();
    const imports = [];

    for (const [componentName, componentPath] of Object.entries(components)) {
      const relativePath = relative(dirname(targetPath), componentPath);
      const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      
      imports.push(`import ${componentName} from '${importPath.replace(/\\/g, '/')}';`);
    }

    return imports.join('\n');
  }

  // 清除缓存
  clearCache() {
    this.layoutCache.clear();
    this.componentCache.clear();
    this.themeManager.clearCache();
  }

  // 重新加载主题
  reloadTheme() {
    this.clearCache();
    console.log('�� 主题已重新加载');
  }
} 