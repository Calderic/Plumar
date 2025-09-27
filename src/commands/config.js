import { ConfigManager } from '../core/config.js';
import { parseArgs } from '../core/utils.js';
import { PlumarError } from '../core/plumar-error.js';

export class ConfigCommand {
  async execute(args) {
    const parsed = parseArgs(args);
    
    if (parsed._.length === 0) {
      await this.showConfig();
      return;
    }

    const subcommand = parsed._[0];
    
    switch (subcommand) {
      case 'set':
        await this.setConfig(parsed._[1], parsed._[2]);
        break;
      case 'get':
        await this.getConfig(parsed._[1]);
        break;
      case 'reset':
        await this.resetConfig();
        break;
      case 'init':
        await this.initConfig();
        break;
      default:
        this.showHelp();
    }
  }

  async showConfig() {
    const configManager = new ConfigManager();
    try {
      const config = await configManager.loadConfig();
      
      console.log('\n⚙️  当前配置:\n');
      
      // 显示主要配置分组
      console.log('🏠 站点信息:');
      console.log(`   标题: ${config.title}`);
      console.log(`   副标题: ${config.subtitle || '(未设置)'}`);
      console.log(`   描述: ${config.description}`);
      console.log(`   作者: ${config.author || '(未设置)'}`);
      console.log(`   语言: ${config.language}`);
      
      console.log('\n🔗 URL 配置:');
      console.log(`   网站地址: ${config.url}`);
      console.log(`   根路径: ${config.root}`);
      console.log(`   永久链接: ${config.permalink}`);
      
      console.log('\n📁 目录配置:');
      console.log(`   内容目录: ${config.source_dir}`);
      console.log(`   输出目录: ${config.public_dir}`);
      
      console.log('\n📝 写作配置:');
      console.log(`   文章文件名: ${config.new_post_name}`);
      console.log(`   默认布局: ${config.default_layout}`);
      console.log(`   显示草稿: ${config.render_drafts ? '是' : '否'}`);
      
      console.log('\n🏷️  分类标签:');
      console.log(`   默认分类: ${config.default_category}`);
      
      console.log('\n📅 日期格式:');
      console.log(`   日期格式: ${config.date_format}`);
      console.log(`   时间格式: ${config.time_format}`);
      
      console.log('\n📄 分页配置:');
      console.log(`   每页文章数: ${config.per_page}`);
      console.log(`   分页目录: ${config.pagination_dir}`);
      
      console.log('\n💡 提示: 使用 `plumar config set <key> <value>` 修改配置');
      console.log('    例如: plumar config set author "张三"');
      console.log('');
      
    } catch (error) {
      if (error instanceof PlumarError) {
        throw error;
      }
      throw PlumarError.configError(error.message, configManager.configPath, error);
    }
  }

  async setConfig(path, value) {
    if (!path || value === undefined) {
      throw PlumarError.argumentError('请提供配置路径和值', path);
    }

    const configManager = new ConfigManager();

    try {
      // 处理不同类型的值
      let processedValue = value;
      if (value === 'true') processedValue = true;
      else if (value === 'false') processedValue = false;
      else if (/^\d+$/.test(value)) processedValue = parseInt(value, 10);
      else if (/^\d+\.\d+$/.test(value)) processedValue = parseFloat(value);
      else if (value.includes(',')) {
        processedValue = value.split(',').map(item => item.trim()).filter(Boolean);
      }

      await configManager.set(path, processedValue);
      console.log(`✅ 配置已更新: ${path} = ${JSON.stringify(processedValue)}`);
      
    } catch (error) {
      if (error instanceof PlumarError) {
        throw error;
      }
      throw PlumarError.configError(error.message, configManager.configPath, error);
    }
  }

  async getConfig(path) {
    if (!path) {
      throw PlumarError.argumentError('请提供配置路径', path);
    }

    const configManager = new ConfigManager();

    try {
      const value = await configManager.get(path);
      
      if (value !== null) {
        console.log(`${path}: ${JSON.stringify(value, null, 2)}`);
      } else {
        throw PlumarError.configError(`配置项 "${path}" 不存在`, configManager.configPath);
      }
      
    } catch (error) {
      if (error instanceof PlumarError) {
        throw error;
      }
      throw PlumarError.configError(error.message, configManager.configPath, error);
    }
  }

  async resetConfig() {
    const configManager = new ConfigManager();
    try {
      configManager.saveConfig(configManager.defaultConfig);
      console.log('✅ 配置已重置为默认值');
      
    } catch (error) {
      if (error instanceof PlumarError) {
        throw error;
      }
      throw PlumarError.configError(error.message, configManager.configPath, error);
    }
  }

  async initConfig() {
    const configManager = new ConfigManager();
    try {
      const config = await configManager.loadConfig();
      
      // 生成初始配置文件
      configManager.saveConfig(config);
      console.log('✅ 配置文件已初始化');
      
    } catch (error) {
      if (error instanceof PlumarError) {
        throw error;
      }
      throw PlumarError.configError(error.message, configManager.configPath, error);
    }
  }

  showHelp() {
    console.log(`
⚙️  config 命令 - 配置管理

用法:
  plumar config                     显示当前配置
  plumar config set <key> <value>   设置配置项
  plumar config get <key>           获取配置项
  plumar config reset               重置为默认配置
  plumar config init                初始化配置文件

配置项说明:
  title                    站点标题
  subtitle                 站点副标题
  description              站点描述
  author                   作者姓名
  language                 站点语言
  timezone                 时区设置
  url                      站点地址
  root                     根路径
  permalink                永久链接格式
  source_dir               内容目录
  public_dir               输出目录
  new_post_name            新文章文件名格式
  default_layout           默认布局
  render_drafts            是否渲染草稿
  default_category         默认分类
  date_format              日期格式
  time_format              时间格式
  per_page                 每页文章数
  pagination_dir           分页目录名

示例:
  plumar config set author "张三"
  plumar config set title "我的技术博客"
  plumar config set permalink ":year/:month/:title/"
  plumar config get author
`);
  }
} 
