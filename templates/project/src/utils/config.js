import { readFileSync } from 'fs';
import { join } from 'path';

// 改进的 YAML 解析器
function parseYAML(yamlContent) {
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
      // 回到上层级
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
      // 数组项 - 这个简化版本不完全支持，但对于基本配置足够了
      // 在实际使用中，我们的配置主要是简单的键值对
    }
  }
  
  return result;
}

// 读取 Plumar 配置
export function getPlumarConfig() {
  try {
    const configPath = join(process.cwd(), 'plumar.config.yml');
    const yamlContent = readFileSync(configPath, 'utf8');
    const config = parseYAML(yamlContent);
    
    // 确保关键字段是正确的类型
    if (typeof config.keywords === 'string' && config.keywords === '[]') {
      config.keywords = [];
    }
    
    return config;
  } catch (error) {
    console.warn('无法读取 plumar.config.yml，使用默认配置');
    return {
      title: '我的博客',
      subtitle: '',
      description: '基于 Astro 和 Plumar 的博客站点',
      author: '',
      language: 'zh-CN',
      keywords: []
    };
  }
} 