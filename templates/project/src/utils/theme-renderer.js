import { existsSync } from 'fs';
import { join } from 'path';

/**
 * 主题渲染工具类
 * 负责检测和加载主题布局
 */
export class ThemeRenderer {
  constructor(config) {
    this.config = config;
    this.currentTheme = config.theme || '2025Plumar';
    this.themesDir = join(process.cwd(), 'themes');
  }

  /**
   * 获取主题布局路径
   * @param {string} layoutName - 布局名称 (home, post, page, default等)
   * @returns {string|null} - 布局文件路径或null
   */
  getThemeLayoutPath(layoutName) {
    if (!this.currentTheme) return null;

    const themePath = join(this.themesDir, this.currentTheme);
    const layoutPath = join(themePath, 'layouts', `${layoutName}.astro`);
    
    return existsSync(layoutPath) ? layoutPath : null;
  }

  /**
   * 检查主题是否存在
   * @param {string} themeName - 主题名称
   * @returns {boolean}
   */
  themeExists(themeName = this.currentTheme) {
    const themePath = join(this.themesDir, themeName);
    return existsSync(themePath) && existsSync(join(themePath, 'theme.info.yml'));
  }

  /**
   * 获取可用的布局列表
   * @returns {string[]} - 可用布局名称列表
   */
  getAvailableLayouts() {
    if (!this.themeExists()) return [];

    const layoutsPath = join(this.themesDir, this.currentTheme, 'layouts');
    if (!existsSync(layoutsPath)) return [];

    try {
      const { readdirSync } = require('fs');
      return readdirSync(layoutsPath)
        .filter(file => file.endsWith('.astro'))
        .map(file => file.replace('.astro', ''));
    } catch {
      return [];
    }
  }

  /**
   * 生成主题状态信息
   * @returns {object} - 主题状态信息
   */
  getThemeStatus() {
    return {
      currentTheme: this.currentTheme,
      themeExists: this.themeExists(),
      availableLayouts: this.getAvailableLayouts(),
      themePath: this.themeExists() ? join(this.themesDir, this.currentTheme) : null
    };
  }

  /**
   * 获取主题配置
   * @returns {object} - 主题配置对象
   */
  getThemeConfig() {
    if (!this.themeExists()) return {};

    const configPath = join(this.themesDir, this.currentTheme, 'theme.config.yml');
    if (!existsSync(configPath)) return {};

    try {
      const { readFileSync } = require('fs');
      const yamlContent = readFileSync(configPath, 'utf8');
      return this.parseYAML(yamlContent);
    } catch {
      return {};
    }
  }

  /**
   * 简单的 YAML 解析器
   * @param {string} yamlContent - YAML 内容
   * @returns {object} - 解析后的对象
   */
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
      }
    }

    return result;
  }
}

/**
 * 创建主题渲染器实例
 * @param {object} config - Plumar配置
 * @returns {ThemeRenderer} - 主题渲染器实例
 */
export function createThemeRenderer(config) {
  return new ThemeRenderer(config);
} 