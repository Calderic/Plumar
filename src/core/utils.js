/**
 * 将字符串转换为 URL 友好的 slug
 */
export function slugify(text) {
  return text
    .toString()
    .trim()
    // 替换空格和标点符号为连字符，保留中文字符和字母数字
    .replace(/[\s\p{P}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * 格式化日期
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 生成文件名 - 支持 Hexo 风格的占位符
 */
export function generateFilename(slug, date, format = ':year-:month-:day-:title.md') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const iMonth = d.getMonth() + 1; // 不补零的月份
  const iDay = d.getDate(); // 不补零的日期

  return format
    .replace(':year', year)
    .replace(':month', month)
    .replace(':i_month', iMonth)
    .replace(':day', day)
    .replace(':i_day', iDay)
    .replace(':title', slug)
    + (format.endsWith('.md') ? '' : '.md');
}

/**
 * 解析命令行参数
 */
export function parseArgs(args) {
  const parsed = {
    _: [],
    flags: {},
    options: {}
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        parsed.options[key] = nextArg;
        i++; // 跳过下一个参数
      } else {
        parsed.flags[key] = true;
      }
    } else if (arg.startsWith('-')) {
      parsed.flags[arg.slice(1)] = true;
    } else {
      parsed._.push(arg);
    }
  }

  return parsed;
}

/**
 * 简单的模板渲染
 */
export function renderTemplate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

/**
 * 确保目录存在
 */
export function ensureDir(dirPath) {
  import('fs').then(fs => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

/**
 * 获取文件统计信息
 */
export function getFileStats(filePath) {
  try {
    const fs = require('fs');
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch {
    return null;
  }
} 