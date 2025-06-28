import { ConfigManager } from '../core/config.js';
import { PostGenerator } from '../core/generator.js';
import { parseArgs } from '../core/utils.js';
import { existsSync } from 'fs';

export class NewCommand {
  async execute(args) {
    const parsed = parseArgs(args);
    
    // 检查是否在站点目录中
    if (!this.isInSiteDirectory()) {
      console.error('❌ 请在 Plumar 站点目录中运行此命令');
      console.log('💡 提示: 使用 `plumar init <site-name>` 创建新站点');
      return;
    }
    
    if (parsed._.length === 0) {
      console.error('❌ 请提供文章标题');
      this.showHelp();
      return;
    }

    // 检查是否是子命令
    const isPage = parsed._[0] === 'page';
    const isDraft = parsed._[0] === 'draft';
    
    let title, type;
    
    if (isPage || isDraft) {
      if (parsed._.length < 2) {
        console.error(`❌ 请提供${isPage ? '页面' : '草稿'}标题`);
        return;
      }
      title = parsed._.slice(1).join(' ');
      type = isPage ? 'page' : 'draft';
    } else {
      title = parsed._.join(' ');
      type = 'post';
    }

    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      const generator = new PostGenerator(config);

      // 解析选项
      const options = {};
      if (parsed.options.tags) {
        options.tags = parsed.options.tags.split(',').map(tag => tag.trim());
      }
      if (parsed.options.category || parsed.options.categories) {
        const cats = parsed.options.category || parsed.options.categories;
        options.categories = cats.split(',').map(cat => cat.trim());
      }
      if (parsed.options.description) {
        options.description = parsed.options.description;
      }
      if (parsed.options.layout) {
        options.layout = parsed.options.layout;
      }

      const result = await generator.generatePost(title, type, options);
      
      console.log(`✅ ${type === 'post' ? '文章' : type === 'page' ? '页面' : '草稿'}创建成功!`);
      console.log(`📁 文件路径: ${result.filepath}`);
      console.log(`🏷️  文件名: ${result.filename}`);
      console.log(`🔗 Slug: ${result.slug}`);
      
    } catch (error) {
      console.error(`❌ 创建失败: ${error.message}`);
    }
  }

  isInSiteDirectory() {
    return existsSync('plumar.config.yml') && 
           existsSync('package.json');
  }

  showHelp() {
    console.log(`
📝 new 命令 - 创建新内容

用法:
  plumar new <title>              创建新文章
  plumar new page <title>         创建新页面
  plumar new draft <title>        创建草稿

选项:
  --tags <tags>                   标签 (逗号分隔)
  --category <category>           分类 (逗号分隔)
  --description <description>     描述
  --layout <layout>               布局模板

示例:
  plumar new "我的第一篇文章"
  plumar new "技术分享" --tags "tech,blog" --category "tutorial"
  plumar new page "关于我" --layout "about"
  plumar new draft "未完成的想法"
`);
  }
} 