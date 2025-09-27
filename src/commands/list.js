import { ConfigManager } from '../core/config.js';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { parseArgs } from '../core/utils.js';
import { PlumarError } from '../core/plumar-error.js';
import { ERROR_CODES } from '../constants.js';

export class ListCommand {
  async execute(args) {
    const parsed = parseArgs(args);
    
    // 检查是否在站点目录中
    if (!this.isInSiteDirectory()) {
      throw PlumarError.siteNotFound(process.cwd());
    }
    
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      
      const posts = this.scanPosts(config.source_dir || 'src/content/blog');
      
      if (posts.length === 0) {
        console.log('📄 暂无文章');
        return;
      }

      // 过滤
      let filteredPosts = posts;
      
      if (parsed.options.type) {
        filteredPosts = posts.filter(post => {
          if (parsed.options.type === 'draft') return post.draft;
          if (parsed.options.type === 'post') return !post.draft && !post.layout;
          if (parsed.options.type === 'page') return post.layout === 'page';
          return true;
        });
      }

      if (parsed.options.tag) {
        filteredPosts = filteredPosts.filter(post => 
          post.tags && post.tags.includes(parsed.options.tag)
        );
      }

      // 排序 (最新的在前)
      filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

      // 显示列表
      this.displayPosts(filteredPosts, parsed.flags.detail || parsed.flags.d);
      
    } catch (error) {
      if (error instanceof PlumarError) {
        throw error;
      }
      throw new PlumarError(
        `读取文章列表失败: ${error.message}`,
        ERROR_CODES.FILE_READ_FAILED,
        [
          '检查内容目录是否存在且可读',
          '确认文章文件的 Front Matter 格式正确',
          '若刚初始化项目，请先创建文章'
        ],
        error
      );
    }
  }

  scanPosts(contentDir) {
    const posts = [];
    
    try {
      const files = readdirSync(contentDir);
      
      for (const file of files) {
        if (extname(file) !== '.md') continue;
        
        const filePath = join(contentDir, file);
        const stats = statSync(filePath);
        const content = readFileSync(filePath, 'utf8');
        const frontMatter = this.parseFrontMatter(content);
        
        posts.push({
          filename: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          ...frontMatter
        });
      }
    } catch (error) {
      // 目录不存在或无法读取
    }
    
    return posts;
  }

  parseFrontMatter(content) {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontMatterMatch) return {};
    
    const frontMatterText = frontMatterMatch[1];
    const data = {};
    
    // 简单的 YAML 解析
    const lines = frontMatterText.split('\n');
    let currentKey = null;
    let isArray = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.startsWith('- ')) {
        // 数组项
        if (currentKey && isArray) {
          if (!Array.isArray(data[currentKey])) {
            data[currentKey] = [];
          }
          data[currentKey].push(trimmed.slice(2).trim());
        }
      } else if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        
        currentKey = key.trim();
        isArray = false;
        
        if (value === '[]') {
          data[currentKey] = [];
        } else if (value === '') {
          // 可能是数组的开始
          isArray = true;
          data[currentKey] = [];
        } else {
          // 移除引号
          data[currentKey] = value.replace(/^["']|["']$/g, '');
          
          // 转换布尔值
          if (data[currentKey] === 'true') data[currentKey] = true;
          if (data[currentKey] === 'false') data[currentKey] = false;
        }
      }
    }
    
    return data;
  }

  displayPosts(posts, showDetail = false) {
    console.log(`\n📚 找到 ${posts.length} 篇文章:\n`);
    
    for (const post of posts) {
      const status = post.draft ? '📝 草稿' : '✅ 发布';
      const type = post.layout === 'page' ? '📄 页面' : '📰 文章';
      
      console.log(`${status} ${type} ${post.title || '未命名'}`);
      console.log(`   📅 ${post.date || '未知日期'}`);
      
      if (post.tags && Array.isArray(post.tags) && post.tags.length > 0) {
        console.log(`   🏷️  ${post.tags.join(', ')}`);
      }
      
      if (post.categories && Array.isArray(post.categories) && post.categories.length > 0) {
        console.log(`   📂 ${post.categories.join(', ')}`);
      }
      
      if (showDetail) {
        console.log(`   📁 ${post.filename}`);
        console.log(`   📊 ${Math.round(post.size / 1024)}KB`);
      }
      
      console.log('');
    }
  }

  isInSiteDirectory() {
    return existsSync('plumar.config.yml') && 
           existsSync('package.json');
  }

  showHelp() {
    console.log(`
📋 list 命令 - 列出文章

用法:
  plumar list [options]

选项:
  --type <type>     按类型过滤 (post/page/draft)
  --tag <tag>       按标签过滤
  -d, --detail      显示详细信息

示例:
  plumar list
  plumar list --type draft
  plumar list --tag tech
  plumar list --detail
`);
  }
} 
