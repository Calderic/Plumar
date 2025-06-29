import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export class ThemeManager {
  constructor(config) {
    this.config = config;
    this.themesDir = join(process.cwd(), 'themes');
    this.currentTheme = config.theme || '2025Plumar';
    this.themeCache = new Map();
  }

  // 获取当前主题路径
  getCurrentThemePath() {
    return join(this.themesDir, this.currentTheme);
  }

  // 检查主题是否存在
  themeExists(themeName) {
    const themePath = join(this.themesDir, themeName);
    return existsSync(themePath) && existsSync(join(themePath, 'theme.info.yml'));
  }

  // 获取所有可用主题
  getAvailableThemes() {
    if (!existsSync(this.themesDir)) {
      return [];
    }

    const themes = [];
    const items = readdirSync(this.themesDir);

    for (const item of items) {
      const themePath = join(this.themesDir, item);
      const stats = statSync(themePath);

      if (stats.isDirectory() && this.themeExists(item)) {
        const themeInfo = this.getThemeInfo(item);
        themes.push({
          name: item,
          path: themePath,
          ...themeInfo
        });
      }
    }

    return themes;
  }

  // 获取主题信息
  getThemeInfo(themeName) {
    const cacheKey = `info_${themeName}`;
    if (this.themeCache.has(cacheKey)) {
      return this.themeCache.get(cacheKey);
    }

    const themePath = join(this.themesDir, themeName);
    const infoPath = join(themePath, 'theme.info.yml');

    if (!existsSync(infoPath)) {
      return {
        name: themeName,
        version: '1.0.0',
        description: '未知主题',
        author: '未知',
        features: []
      };
    }

    try {
      const yamlContent = readFileSync(infoPath, 'utf8');
      const themeInfo = this.parseYAML(yamlContent);
      this.themeCache.set(cacheKey, themeInfo);
      return themeInfo;
    } catch (error) {
      console.warn(`⚠️  读取主题信息失败: ${error.message}`);
      return { name: themeName };
    }
  }

  // 获取主题配置
  getThemeConfig(themeName = this.currentTheme) {
    const cacheKey = `config_${themeName}`;
    if (this.themeCache.has(cacheKey)) {
      return this.themeCache.get(cacheKey);
    }

    const themePath = join(this.themesDir, themeName);
    const configPaths = [
      join(themePath, 'theme.config.yml'),
      join(themePath, 'theme.config.js'),
      join(themePath, 'theme.config.mjs')
    ];

    let themeConfig = {};

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        try {
          if (configPath.endsWith('.yml')) {
            const yamlContent = readFileSync(configPath, 'utf8');
            themeConfig = this.parseYAML(yamlContent);
          } else {
            // 对于 JS/MJS 配置文件，我们暂时跳过，后续可以扩展
            console.log(`💡 检测到 JS 配置文件，暂不支持: ${configPath}`);
          }
          break;
        } catch (error) {
          console.warn(`⚠️  读取主题配置失败: ${error.message}`);
        }
      }
    }

    this.themeCache.set(cacheKey, themeConfig);
    return themeConfig;
  }

  // 设置当前主题
  setTheme(themeName) {
    if (!this.themeExists(themeName)) {
      throw new Error(`主题 "${themeName}" 不存在`);
    }

    this.currentTheme = themeName;
    
    // 更新配置文件
    this.config.theme = themeName;
    this.saveGlobalConfig();
    
    console.log(`✅ 主题配置已更新: ${themeName}`);
  }

  // 保存全局配置
  saveGlobalConfig() {
    // 这里需要调用 ConfigManager 来保存配置
    // 为了保持解耦，我们通过事件或回调的方式处理
    if (this.onConfigChange) {
      this.onConfigChange(this.config);
    }
  }

  // 获取主题布局文件
  getThemeLayouts(themeName = this.currentTheme) {
    const themePath = join(this.themesDir, themeName);
    const layoutsPath = join(themePath, 'layouts');
    
    if (!existsSync(layoutsPath)) {
      return {};
    }

    const layouts = {};
    const files = readdirSync(layoutsPath);

    for (const file of files) {
      if (file.endsWith('.astro')) {
        const layoutName = file.replace('.astro', '');
        layouts[layoutName] = join(layoutsPath, file);
      }
    }

    return layouts;
  }

  // 获取主题组件文件
  getThemeComponents(themeName = this.currentTheme) {
    const themePath = join(this.themesDir, themeName);
    const componentsPath = join(themePath, 'components');
    
    if (!existsSync(componentsPath)) {
      return {};
    }

    const components = {};
    const files = readdirSync(componentsPath);

    for (const file of files) {
      if (file.endsWith('.astro')) {
        const componentName = file.replace('.astro', '');
        components[componentName] = join(componentsPath, file);
      }
    }

    return components;
  }

  // 获取主题样式文件
  getThemeStyles(themeName = this.currentTheme) {
    const themePath = join(this.themesDir, themeName);
    const stylesPath = join(themePath, 'styles');
    
    if (!existsSync(stylesPath)) {
      return [];
    }

    const styles = [];
    const files = readdirSync(stylesPath);

    for (const file of files) {
      if (file.endsWith('.css') || file.endsWith('.scss')) {
        styles.push(join(stylesPath, file));
      }
    }

    return styles;
  }



  // 简单的 YAML 解析器（重用之前的实现）
  parseYAML(yamlContent) {
    const lines = yamlContent.split('\n');
    const result = {};
    let currentObj = result;
    const stack = [result];
    let currentIndent = 0;

    for (let line of lines) {
      line = line.replace(/\s*#.*$/, ''); // 移除注释
      if (!line.trim()) continue;

      const indent = line.length - line.trimLeft().length;
      const trimmed = line.trim();

      // 处理层级变化
      if (indent < currentIndent) {
        while (stack.length > 1 && indent < currentIndent) {
          stack.pop();
          currentIndent -= 2;
        }
        currentObj = stack[stack.length - 1];
        currentIndent = indent;
      }

      if (trimmed.endsWith(':')) {
        // 对象键
        const key = trimmed.slice(0, -1);

        if (indent > currentIndent) {
          // 进入新层级
          const newObj = {};
          currentObj[key] = newObj;
          stack.push(newObj);
          currentObj = newObj;
          currentIndent = indent;
        } else {
          // 同层级新对象
          currentObj[key] = {};
          stack.push(currentObj[key]);
          currentObj = currentObj[key];
        }
      } else if (trimmed.includes(':')) {
        // 键值对
        const [key, ...valueParts] = trimmed.split(':');
        let value = valueParts.join(':').trim();

        // 处理不同类型的值
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value === 'null') value = null;
        else if (value.match(/^\d+$/)) value = parseInt(value);
        else if (value.match(/^\d+\.\d+$/)) value = parseFloat(value);
        else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        else if (value === '[]') value = [];
        else if (value === '{}') value = {};

        currentObj[key.trim()] = value;
      } else if (trimmed.startsWith('-')) {
        // 数组项处理
        const value = trimmed.slice(1).trim();
        const parentKey = Object.keys(currentObj).pop();
        if (parentKey && Array.isArray(currentObj[parentKey])) {
          currentObj[parentKey].push(value.replace(/^["']|["']$/g, ''));
        }
      }
    }

    return result;
  }

  // 清除缓存
  clearCache() {
    this.themeCache.clear();
  }
} 