import { ConfigManager } from '../core/config.js';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { parseArgs } from '../core/utils.js';

export class StatsCommand {
  async execute(args) {
    const parsed = parseArgs(args);
    
    // 检查是否在站点目录中
    if (!this.isInSiteDirectory()) {
      console.error('❌ 请在 Plumar 站点目录中运行此命令');
      console.log('💡 提示: 使用 `plumar init <site-name>` 创建新站点');
      return;
    }
    
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      
      const posts = this.scanPosts(config.source_dir || 'src/content/blog');
      
      if (posts.length === 0) {
        console.log('📊 暂无统计数据');
        return;
      }

      this.displayStats(posts, parsed.flags.detail || parsed.flags.d);
      
    } catch (error) {
      console.error(`❌ 获取统计信息失败: ${error.message}`);
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
        
        // 计算字数 (简单计算)
        const wordCount = this.countWords(content);
        
        posts.push({
          filename: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          wordCount,
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
    
    const lines = frontMatterText.split('\n');
    let currentKey = null;
    let isArray = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.startsWith('- ')) {
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
          isArray = true;
          data[currentKey] = [];
        } else {
          data[currentKey] = value.replace(/^["']|["']$/g, '');
          if (data[currentKey] === 'true') data[currentKey] = true;
          if (data[currentKey] === 'false') data[currentKey] = false;
        }
      }
    }
    
    return data;
  }

  countWords(content) {
    // 移除 Front Matter
    const contentWithoutFM = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    
    // 简单的字数统计 (中英文)
    const chineseChars = (contentWithoutFM.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (contentWithoutFM.match(/[a-zA-Z]+/g) || []).length;
    
    return chineseChars + englishWords;
  }

  displayStats(posts, showDetail = false) {
    console.log('\n📊 博客统计信息\n');
    
    // 基本统计
    const totalPosts = posts.filter(p => !p.draft && p.layout !== 'page').length;
    const totalPages = posts.filter(p => p.layout === 'page').length;
    const totalDrafts = posts.filter(p => p.draft).length;
    const totalWords = posts.reduce((sum, p) => sum + (p.wordCount || 0), 0);
    const totalSize = posts.reduce((sum, p) => sum + (p.size || 0), 0);
    
    console.log('📈 总体统计:');
    console.log(`   📰 文章: ${totalPosts} 篇`);
    console.log(`   📄 页面: ${totalPages} 个`);
    console.log(`   📝 草稿: ${totalDrafts} 篇`);
    console.log(`   📝 总字数: ${totalWords.toLocaleString()} 字`);
    console.log(`   💾 总大小: ${Math.round(totalSize / 1024)} KB`);
    
    // 标签统计
    const tagStats = this.getTagStats(posts);
    if (tagStats.length > 0) {
      console.log('\n🏷️  热门标签:');
      tagStats.slice(0, 10).forEach(([tag, count]) => {
        console.log(`   ${tag}: ${count} 篇`);
      });
    }
    
    // 分类统计
    const categoryStats = this.getCategoryStats(posts);
    if (categoryStats.length > 0) {
      console.log('\n📂 分类统计:');
      categoryStats.slice(0, 10).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} 篇`);
      });
    }
    
    // 时间统计
    if (showDetail) {
      this.displayTimeStats(posts);
    }
    
    // 最近文章
    const recentPosts = posts
      .filter(p => !p.draft && p.layout !== 'page')
      .sort((a, b) => new Date(b.date || b.created) - new Date(a.date || a.created))
      .slice(0, 5);
      
    if (recentPosts.length > 0) {
      console.log('\n📅 最近文章:');
      recentPosts.forEach(post => {
        const date = post.date || post.created.toISOString().split('T')[0];
        console.log(`   ${post.title || post.filename} (${date})`);
      });
    }
    
    console.log('');
  }

  getTagStats(posts) {
    const tagCount = {};
    
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a);
  }

  getCategoryStats(posts) {
    const categoryCount = {};
    
    posts.forEach(post => {
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach(category => {
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
      }
    });
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a);
  }

  displayTimeStats(posts) {
    const publishedPosts = posts.filter(p => !p.draft && p.layout !== 'page');
    
    if (publishedPosts.length === 0) return;
    
    // 按年份统计
    const yearStats = {};
    publishedPosts.forEach(post => {
      const year = new Date(post.date || post.created).getFullYear();
      yearStats[year] = (yearStats[year] || 0) + 1;
    });
    
    console.log('\n📆 年度统计:');
    Object.entries(yearStats)
      .sort(([a], [b]) => b - a)
      .forEach(([year, count]) => {
        console.log(`   ${year}: ${count} 篇`);
      });
    
    // 平均字数
    const avgWords = Math.round(
      publishedPosts.reduce((sum, p) => sum + (p.wordCount || 0), 0) / publishedPosts.length
    );
    console.log(`\n📊 平均字数: ${avgWords} 字/篇`);
  }

  isInSiteDirectory() {
    return existsSync('plumar.config.yml') && 
           existsSync('package.json');
  }

  showHelp() {
    console.log(`
📊 stats 命令 - 文章统计

用法:
  plumar stats [options]

选项:
  -d, --detail      显示详细统计信息

示例:
  plumar stats
  plumar stats --detail
`);
  }
} 