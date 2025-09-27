import { ConfigManager } from '../core/config.js';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { parseArgs } from '../core/utils.js';
import { PlumarError } from '../core/plumar-error.js';
import { ERROR_CODES } from '../constants.js';

export class PublishCommand {
  async execute(args) {
    const parsed = parseArgs(args);
    
    // 检查是否在站点目录中
    if (!this.isInSiteDirectory()) {
      throw PlumarError.siteNotFound(process.cwd());
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
        throw new PlumarError(
          `未找到标题为 "${title}" 的草稿`,
          ERROR_CODES.FILE_NOT_FOUND,
          [
            '使用 `plumar list --type draft` 查看草稿列表',
            '确认草稿标题与命令输入完全一致',
            '草稿文件位于内容目录且 draft: true'
          ]
        );
      }

      this.publishDraft(draftFile);
      console.log(`✅ 草稿 "${title}" 已发布！`);
      
    } catch (error) {
      if (error instanceof PlumarError) {
        throw error;
      }
      throw new PlumarError(
        `发布草稿失败: ${error.message}`,
        ERROR_CODES.FILE_OPERATION_ERROR,
        [
          '确认草稿文件未被占用',
          '检查内容目录权限是否足够写入',
          '若重复执行，可先手动修改 draft 字段'
        ],
        error
      );
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
