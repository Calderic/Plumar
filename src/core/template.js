import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class TemplateEngine {
  constructor(config) {
    this.config = config;
    this.templateCache = new Map();
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
    // 优先使用用户自定义模板
    const userTemplate = join('./templates', `${type}.md`);
    if (existsSync(userTemplate)) {
      return userTemplate;
    }

    // 使用默认模板 - 如果没有用户模板，使用内置模板
    const defaultTemplate = join('./templates', `${type}.md`);
    return defaultTemplate;
  }

  clearCache() {
    this.templateCache.clear();
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