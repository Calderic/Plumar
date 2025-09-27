import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parseYAML, stringifyYAML } from './yaml-parser.js';
import { PlumarError } from './plumar-error.js';
import { CONFIG_SCHEMA } from '../constants.js';

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
      theme: '2025Plumar',
      theme_config: {},
      deploy: {}
    };
  }

  async loadConfig() {
    try {
      if (existsSync(this.configPath)) {
        const yamlContent = readFileSync(this.configPath, 'utf8');
        const userConfig = parseYAML(yamlContent, {
          filePath: this.configPath,
          context: '配置文件'
        });
        const merged = this.mergeConfig(this.defaultConfig, userConfig);
        return this.applySchema(merged);
      }
    } catch (error) {
      if (error instanceof PlumarError) {
        throw error;
      }
      throw PlumarError.configError(error.message, this.configPath, error);
    }
    return this.applySchema({ ...this.defaultConfig });
  }

  saveConfig(config) {
    const schemaApplied = this.applySchema(config);
    const yamlContent = stringifyYAML(schemaApplied);
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

  applySchema(config) {
    const result = JSON.parse(JSON.stringify(config));

    if (CONFIG_SCHEMA?.defaults) {
      for (const [key, value] of Object.entries(CONFIG_SCHEMA.defaults)) {
        if (result[key] === undefined || result[key] === null || result[key] === '') {
          result[key] = value;
        }
      }
    }

    if (CONFIG_SCHEMA?.required) {
      const missing = CONFIG_SCHEMA.required.filter(key =>
        result[key] === undefined || result[key] === null || result[key] === ''
      );

      if (missing.length > 0) {
        throw PlumarError.configError(
          `缺少必需配置项: ${missing.join(', ')}`,
          this.configPath
        );
      }
    }

    if (CONFIG_SCHEMA?.types) {
      for (const [key, expectedType] of Object.entries(CONFIG_SCHEMA.types)) {
        if (result[key] === undefined || result[key] === null) {
          continue;
        }

        result[key] = this.coerceType(result[key], expectedType, key);
      }
    }

    return result;
  }

  coerceType(value, expectedType, key) {
    switch (expectedType) {
      case 'string':
        if (typeof value === 'string') return value;
        return String(value);
      case 'number': {
        if (typeof value === 'number' && !Number.isNaN(value)) {
          return value;
        }
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
        throw PlumarError.configError(
          `配置项 "${key}" 需要数值类型，但当前值为 ${value}`,
          this.configPath
        );
      }
      case 'boolean': {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          if (value.toLowerCase() === 'true') return true;
          if (value.toLowerCase() === 'false') return false;
        }
        throw PlumarError.configError(
          `配置项 "${key}" 需要布尔类型，但当前值为 ${value}`,
          this.configPath
        );
      }
      default:
        return value;
    }
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
