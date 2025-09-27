import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { parseYAML } from './yaml-parser.js';
import { PlumarError } from './plumar-error.js';

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
      const themeInfo = parseYAML(yamlContent, {
        filePath: infoPath,
        context: '主题信息'
      });
      this.themeCache.set(cacheKey, themeInfo);
      return themeInfo;
    } catch (error) {
      if (error instanceof PlumarError) {
        console.warn(`⚠️  主题信息解析失败: ${error.message}`);
      } else {
        console.warn(`⚠️  读取主题信息失败: ${error.message}`);
      }
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
            themeConfig = parseYAML(yamlContent, {
              filePath: configPath,
              context: '主题配置'
            });
          } else {
            // 对于 JS/MJS 配置文件，我们暂时跳过，后续可以扩展
            console.log(`💡 检测到 JS 配置文件，暂不支持: ${configPath}`);
          }
          break;
        } catch (error) {
          if (error instanceof PlumarError) {
            console.warn(`⚠️  主题配置解析失败: ${error.message}`);
          } else {
            console.warn(`⚠️  读取主题配置失败: ${error.message}`);
          }
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

  // 清除缓存
  clearCache() {
    this.themeCache.clear();
  }
}
