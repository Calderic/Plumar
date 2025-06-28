import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export class ConfigManager {
  constructor() {
    this.configPath = join(process.cwd(), 'plumar.config.yml');
    this.defaultConfig = {
      // 站点信息 - 参考 Hexo Site 配置
      title: '我的博客',
      subtitle: '',
      description: '基于 Astro 和 Plumar 的博客站点',
      keywords: [],
      author: '',
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',

      // URL 配置 - 参考 Hexo URL 配置
      url: 'https://your-site.com',
      root: '/',
      permalink: ':year/:month/:day/:title/',

      // 目录配置 - 参考 Hexo Directory 配置
      source_dir: 'src/content/blog',
      public_dir: 'dist',

      // 写作配置 - 参考 Hexo Writing 配置
      new_post_name: ':year-:month-:day-:title.md',
      default_layout: 'post',
      filename_case: 0,
      render_drafts: false,

      // 分类和标签 - 参考 Hexo Category & Tag 配置
      default_category: '未分类',
      category_map: {},
      tag_map: {},

      // 日期时间格式 - 参考 Hexo Date/Time 配置
      date_format: 'YYYY-MM-DD',
      time_format: 'HH:mm:ss',

      // 分页配置 - 参考 Hexo Pagination 配置
      per_page: 10,
      pagination_dir: 'page',

      // 扩展配置 - 参考 Hexo Extensions 配置
      theme: '',
      deploy: {}
    };
  }

  async loadConfig() {
    try {
      if (existsSync(this.configPath)) {
        const yamlContent = readFileSync(this.configPath, 'utf8');
        const userConfig = this.parseYAML(yamlContent);
        return this.mergeConfig(this.defaultConfig, userConfig);
      }
    } catch (error) {
      console.warn(`⚠️  配置文件加载失败，使用默认配置: ${error.message}`);
    }
    return this.defaultConfig;
  }

  saveConfig(config) {
    const yamlContent = this.stringifyYAML(config);
    writeFileSync(this.configPath, yamlContent, 'utf8');
    console.log('✅ 配置已保存到 plumar.config.yml');
  }

  mergeConfig(defaultConfig, userConfig) {
    const result = JSON.parse(JSON.stringify(defaultConfig));
    return this.deepMerge(result, userConfig);
  }

  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  parseYAML(yamlContent) {
    // 简单的 YAML 解析器
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

      if (trimmed.endsWith(':')) {
        // 对象键
        const key = trimmed.slice(0, -1);
        
        if (indent > currentIndent) {
          // 进入新层级
          const newObj = {};
          currentObj[key] = newObj;
          stack.push(newObj);
          currentObj = newObj;
        } else if (indent < currentIndent) {
          // 回到上层级
          while (stack.length > 1 && indent < currentIndent) {
            stack.pop();
            currentIndent -= 2;
          }
          currentObj = stack[stack.length - 1];
          currentObj[key] = {};
          stack.push(currentObj[key]);
          currentObj = currentObj[key];
        } else {
          // 同层级
          currentObj[key] = {};
          stack.push(currentObj[key]);
          currentObj = currentObj[key];
        }
        currentIndent = indent;
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
        else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        
        currentObj[key.trim()] = value;
      }
    }

    return result;
  }

  stringifyYAML(obj, indent = 0) {
    let result = '';
    const spaces = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result += `${spaces}${key}:\n`;
        result += this.stringifyYAML(value, indent + 1);
      } else if (Array.isArray(value)) {
        result += `${spaces}${key}:\n`;
        for (const item of value) {
          result += `${spaces}  - ${item}\n`;
        }
      } else {
        const valueStr = typeof value === 'string' ? `"${value}"` : value;
        result += `${spaces}${key}: ${valueStr}\n`;
      }
    }

    return result;
  }

  showConfig() {
    return this.loadConfig();
  }

  // 获取配置值的便捷方法
  async get(path, defaultValue = null) {
    const config = await this.loadConfig();
    const keys = path.split('.');
    let current = config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }
    
    return current;
  }

  // 设置配置值的便捷方法
  async set(path, value) {
    const config = await this.loadConfig();
    const keys = path.split('.');
    let current = config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    this.saveConfig(config);
  }
} 