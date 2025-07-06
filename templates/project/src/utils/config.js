import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

// 读取 Plumar 配置
export function getPlumarConfig() {
  try {
    const configPath = join(process.cwd(), 'plumar.config.yml');
    
    if (!existsSync(configPath)) {
      console.warn('未找到 plumar.config.yml，使用默认配置');
      return getDefaultConfig();
    }
    
    const yamlContent = readFileSync(configPath, 'utf8');
    const config = yaml.load(yamlContent) || {};
    
    // 合并默认配置，确保必要字段存在
    return {
      ...getDefaultConfig(),
      ...config
    };
  } catch (error) {
    console.warn('读取 plumar.config.yml 失败，使用默认配置:', error.message);
    return getDefaultConfig();
  }
}

// 默认配置
function getDefaultConfig() {
  return {
    title: '我的博客',
    subtitle: '',
    description: '基于 Astro 和 Plumar 的博客站点',
    author: '',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    keywords: [],
    theme: '2025Plumar',
    url: 'https://your-site.com',
    root: '/',
    source_dir: 'src/content/blog',
    public_dir: 'dist'
  };
} 