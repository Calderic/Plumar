import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { slugify, formatDate, generateFilename, renderTemplate } from './utils.js';
import { TemplateEngine } from './template.js';

export class PostGenerator {
  constructor(config) {
    this.config = config;
    this.templateEngine = new TemplateEngine(config);
  }

  async generatePost(title, type = 'post', options = {}) {
    const slug = slugify(title);
    const date = new Date();
    
    // 生成 Front Matter
    const frontMatter = this.generateFrontMatter(title, date, type, options);
    
    // 获取模板
    const template = await this.templateEngine.getTemplate(type);
    
    // 渲染内容
    const content = this.renderContent(template, {
      title,
      slug,
      date: formatDate(date),
      frontMatter: this.serializeFrontMatter(frontMatter),
      ...options
    });

    // 生成文件路径 - 使用新的配置结构
    const filename = generateFilename(slug, date, this.config.new_post_name || ':year-:month-:day-:title.md');
    const filepath = join(this.config.source_dir || 'src/content/blog', filename);
    
    // 确保目录存在
    const dir = dirname(filepath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // 写入文件
    writeFileSync(filepath, content, 'utf8');
    
    return { 
      filepath, 
      filename, 
      slug,
      title,
      type,
      date: formatDate(date)
    };
  }

  generateFrontMatter(title, date, type, options) {
    const base = {
      title,
      date: formatDate(date),
      slug: slugify(title),
      draft: type === 'draft',
      tags: options.tags || [],
      categories: options.categories || [this.config.default_category || '未分类'],
      description: options.description || '',
    };

    // 添加自定义字段
    if (this.config.author) base.author = this.config.author;
    if (options.layout) base.layout = options.layout;

    return { ...base, ...(options.frontMatter || {}) };
  }

  serializeFrontMatter(frontMatter) {
    const lines = ['---'];
    
    for (const [key, value] of Object.entries(frontMatter)) {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          lines.push(`${key}: []`);
        } else {
          lines.push(`${key}:`);
          value.forEach(item => lines.push(`  - ${item}`));
        }
      } else if (typeof value === 'string') {
        lines.push(`${key}: "${value}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
    
    lines.push('---');
    return lines.join('\n');
  }

  renderContent(template, data) {
    return renderTemplate(template, data);
  }
} 