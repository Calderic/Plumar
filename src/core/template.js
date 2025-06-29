import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ThemeManager } from './theme.js';
import { LayoutEngine } from './layout.js';

export class TemplateEngine {
  constructor(config) {
    this.config = config;
    this.templateCache = new Map();
    this.themeManager = new ThemeManager(config);
    this.layoutEngine = new LayoutEngine(config, this.themeManager);
  }

  async getTemplate(type) {
    // 检查缓存
    if (this.templateCache.has(type)) {
      return this.templateCache.get(type);
    }

    const templatePath = this.resolveTemplatePath(type);
    
    if (!existsSync(templatePath)) {
      throw new Error(`模板文件不存在: ${templatePath}`);
    }

    const template = readFileSync(templatePath, 'utf8');
    this.templateCache.set(type, template);
    return template;
  }

  resolveTemplatePath(type) {
    // 1. 优先使用用户自定义模板
    const userTemplate = join('./templates', `${type}.md`);
    if (existsSync(userTemplate)) {
      return userTemplate;
    }

    // 2. 尝试使用当前主题的模板
    const currentTheme = this.config.theme || '2025Plumar';
    const themeTemplatePath = join('./themes', currentTheme, 'templates', `${type}.md`);
    if (existsSync(themeTemplatePath)) {
      return themeTemplatePath;
    }

    // 3. 使用默认模板 - 如果没有用户模板和主题模板，使用内置模板
    const defaultTemplate = join('./templates', `${type}.md`);
    return defaultTemplate;
  }

  // 渲染主题布局
  async renderLayout(layoutName, data = {}) {
    try {
      return this.layoutEngine.getLayout(layoutName, data);
    } catch (error) {
      console.warn(`⚠️  渲染布局失败: ${error.message}`);
      return null;
    }
  }

  // 获取主题组件
  getThemeComponent(componentName) {
    try {
      return this.layoutEngine.getComponent(componentName);
    } catch (error) {
      console.warn(`⚠️  获取组件失败: ${error.message}`);
      return null;
    }
  }

  // 获取主题配置
  getThemeConfig() {
    return this.themeManager.getThemeConfig();
  }



  clearCache() {
    this.templateCache.clear();
    this.layoutEngine.clearCache();
  }

  listTemplates() {
    const templates = [];
    
    // 扫描用户模板
    try {
      const fs = require('fs');
      const templateDir = './templates';
      if (existsSync(templateDir)) {
        const userTemplates = fs.readdirSync(templateDir)
          .filter(file => file.endsWith('.md'))
          .map(file => ({
            name: file.replace('.md', ''),
            type: 'user',
            path: join(templateDir, file)
          }));
        templates.push(...userTemplates);
      }
    } catch (error) {
      // 忽略错误
    }

    return templates;
  }
} 