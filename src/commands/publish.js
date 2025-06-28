import { ConfigManager } from '../core/config.js';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { parseArgs } from '../core/utils.js';

export class PublishCommand {
  async execute(args) {
    const parsed = parseArgs(args);
    
    // 检查是否在站点目录中
    if (!this.isInSiteDirectory()) {
      console.error('❌ 请在 Plumar 站点目录中运行此命令');
      console.log('💡 提示: 使用 `plumar init <site-name>` 创建新站点');
      return;
    }
    
    if (parsed._.length === 0) {
      console.error('❌ 请提供要发布的草稿标题');
      this.showHelp();
      return;
    }

    const title = parsed._.join(' ');
    
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      
      const contentDir = config.source_dir || 'src/content/blog';
      const draftFile = this.findDraftByTitle(contentDir, title);
      
      if (!draftFile) {
        console.error(`❌ 未找到标题为 "${title}" 的草稿`);
        this.listDrafts(contentDir);
        return;
      }

      this.publishDraft(draftFile);
      console.log(`✅ 草稿 "${title}" 已发布！`);
      
    } catch (error) {
      console.error(`❌ 发布失败: ${error.message}`);
    }
  }

  findDraftByTitle(contentDir, title) {
    try {
      const files = readdirSync(contentDir);
      
      for (const file of files) {
        if (extname(file) !== '.md') continue;
        
        const filePath = join(contentDir, file);
        const content = readFileSync(filePath, 'utf8');
        const frontMatter = this.parseFrontMatter(content);
        
        if (frontMatter.draft && frontMatter.title === title) {
          return filePath;
        }
      }
    } catch (error) {
      // 目录不存在或无法读取
    }
    
    return null;
  }

  publishDraft(filePath) {
    const content = readFileSync(filePath, 'utf8');
    
    // 将 draft: true 改为 draft: false
    const updatedContent = content.replace(
      /^draft:\s*true$/m,
      'draft: false'
    );
    
    writeFileSync(filePath, updatedContent, 'utf8');
  }

  parseFrontMatter(content) {
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontMatterMatch) return {};
    
    const frontMatterText = frontMatterMatch[1];
    const data = {};
    
    const lines = frontMatterText.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes(':')) continue;
      
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      
      data[key.trim()] = value.replace(/^["']|["']$/g, '');
      
      // 转换布尔值
      if (data[key.trim()] === 'true') data[key.trim()] = true;
      if (data[key.trim()] === 'false') data[key.trim()] = false;
    }
    
    return data;
  }

  listDrafts(contentDir) {
    console.log('\n📝 可用的草稿:');
    
    try {
      const files = readdirSync(contentDir);
      const drafts = [];
      
      for (const file of files) {
        if (extname(file) !== '.md') continue;
        
        const filePath = join(contentDir, file);
        const content = readFileSync(filePath, 'utf8');
        const frontMatter = this.parseFrontMatter(content);
        
        if (frontMatter.draft) {
          drafts.push(frontMatter.title || file);
        }
      }
      
      if (drafts.length === 0) {
        console.log('   (暂无草稿)');
      } else {
        drafts.forEach(title => console.log(`   - ${title}`));
      }
      
    } catch (error) {
      console.log('   (无法读取草稿列表)');
    }
    
    console.log('');
  }

  isInSiteDirectory() {
    return existsSync('plumar.config.yml') && 
           existsSync('package.json');
  }

  showHelp() {
    console.log(`
🚀 publish 命令 - 发布草稿

用法:
  plumar publish <title>

参数:
  title             要发布的草稿标题

示例:
  plumar publish "我的草稿文章"
`);
  }
} 