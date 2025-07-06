import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

// 读取 Plumar 配置来获取当前主题
function getCurrentTheme() {
  try {
    const configPath = join(process.cwd(), 'plumar.config.yml');
    if (!existsSync(configPath)) {
      return '2025Plumar';
    }
    
    const configContent = readFileSync(configPath, 'utf-8');
    const config = yaml.load(configContent);
    
    return config?.theme || '2025Plumar';
  } catch (error) {
    console.warn('读取主题配置失败，使用默认主题:', error.message);
    return '2025Plumar'; // 默认主题
  }
}

const currentTheme = getCurrentTheme();

export default defineConfig({
  integrations: [mdx()],
  vite: {
    resolve: {
      alias: {
        '@theme': new URL(`./themes/${currentTheme}`, import.meta.url).pathname
      }
    }
  }
}); 