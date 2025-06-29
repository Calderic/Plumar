import { ThemeManager } from '../core/theme.js';
import { ConfigManager } from '../core/config.js';
import { ThemeValidator } from '../core/theme-validator.js';
import { parseArgs } from '../core/utils.js';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export class ThemeCommand {
  async execute(args) {
    const parsed = parseArgs(args);
    
    if (parsed._.length === 0) {
      await this.showThemeStatus();
      return;
    }

    const subcommand = parsed._[0];
    
    switch (subcommand) {
      case 'list':
        await this.listThemes();
        break;
      case 'info':
        await this.showThemeInfo(parsed._[1]);
        break;
      case 'set':
        await this.setTheme(parsed._[1]);
        break;
      case 'config':
        await this.configTheme(parsed._[1], parsed._[2]);
        break;
      case 'create':
        await this.createTheme(parsed._[1]);
        break;
      case 'validate':
        await this.validateTheme(parsed._[1]);
        break;

      default:
        this.showHelp();
    }
  }

  // 显示当前主题状态
  async showThemeStatus() {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      const themeManager = new ThemeManager(config);

      console.log('\n🎨 主题状态:\n');
      
      const currentTheme = config.theme || '2025Plumar';
      console.log(`当前主题: ${currentTheme}`);
      
      if (themeManager.themeExists(currentTheme)) {
        const themeInfo = themeManager.getThemeInfo(currentTheme);
        console.log(`版本: ${themeInfo.version || '未知'}`);
        console.log(`描述: ${themeInfo.description || '无描述'}`);
        console.log(`作者: ${themeInfo.author || '未知'}`);
        
        if (themeInfo.features && themeInfo.features.length > 0) {
          console.log(`特性: ${themeInfo.features.join(', ')}`);
        }
      } else {
        console.log('⚠️  当前主题不存在或无效');
      }
      
      console.log('\n💡 使用 `plumar theme list` 查看所有可用主题');
      console.log('   使用 `plumar theme set <theme-name>` 切换主题');
      console.log('');

    } catch (error) {
      console.error(`❌ 获取主题状态失败: ${error.message}`);
    }
  }

  // 列出所有主题
  async listThemes() {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      const themeManager = new ThemeManager(config);

      const themes = themeManager.getAvailableThemes();
      
      if (themes.length === 0) {
        console.log('📭 没有找到可用的主题');
        console.log('💡 使用 `plumar theme create <theme-name>` 创建新主题');
        return;
      }

      console.log('\n🎨 可用主题:\n');
      
      const currentTheme = config.theme || '2025Plumar';
      
      for (const theme of themes) {
        const current = theme.name === currentTheme ? ' (当前)' : '';
        const status = theme.name === currentTheme ? '✅' : '⭕';
        
        console.log(`${status} ${theme.name}${current}`);
        console.log(`   版本: ${theme.version || '未知'}`);
        console.log(`   描述: ${theme.description || '无描述'}`);
        
        if (theme.features && theme.features.length > 0) {
          console.log(`   特性: ${theme.features.join(', ')}`);
        }
        console.log('');
      }

    } catch (error) {
      console.error(`❌ 列出主题失败: ${error.message}`);
    }
  }

  // 显示主题详细信息
  async showThemeInfo(themeName) {
    if (!themeName) {
      console.error('❌ 请提供主题名称');
      console.log('💡 用法: plumar theme info <theme-name>');
      return;
    }

    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      const themeManager = new ThemeManager(config);

      if (!themeManager.themeExists(themeName)) {
        console.error(`❌ 主题 "${themeName}" 不存在`);
        return;
      }

      const themeInfo = themeManager.getThemeInfo(themeName);
      const themeConfig = themeManager.getThemeConfig(themeName);
      const layouts = themeManager.getThemeLayouts(themeName);
      const components = themeManager.getThemeComponents(themeName);
      const styles = themeManager.getThemeStyles(themeName);

      console.log(`\n🎨 主题信息: ${themeName}\n`);
      
      console.log('📋 基本信息:');
      console.log(`   名称: ${themeInfo.name || themeName}`);
      console.log(`   版本: ${themeInfo.version || '未知'}`);
      console.log(`   描述: ${themeInfo.description || '无描述'}`);
      console.log(`   作者: ${themeInfo.author || '未知'}`);
      
      if (themeInfo.features && themeInfo.features.length > 0) {
        console.log(`   特性: ${themeInfo.features.join(', ')}`);
      }

      console.log('\n📁 文件结构:');
      console.log(`   布局文件: ${Object.keys(layouts).length} 个`);
      console.log(`   组件文件: ${Object.keys(components).length} 个`);
      console.log(`   样式文件: ${styles.length} 个`);

      if (Object.keys(layouts).length > 0) {
        console.log('\n🎭 布局文件:');
        for (const layout of Object.keys(layouts)) {
          console.log(`   - ${layout}.astro`);
        }
      }

      if (Object.keys(components).length > 0) {
        console.log('\n🧩 组件文件:');
        for (const component of Object.keys(components)) {
          console.log(`   - ${component}.astro`);
        }
      }

      if (Object.keys(themeConfig).length > 0) {
        console.log('\n⚙️  主题配置:');
        this.displayObject(themeConfig, '   ');
      }

      console.log('');

    } catch (error) {
      console.error(`❌ 获取主题信息失败: ${error.message}`);
    }
  }

  // 设置主题
  async setTheme(themeName) {
    if (!themeName) {
      console.error('❌ 请提供主题名称');
      console.log('💡 用法: plumar theme set <theme-name>');
      return;
    }

    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      const themeManager = new ThemeManager(config);

      // 设置配置变更回调
      themeManager.onConfigChange = (newConfig) => {
        configManager.saveConfig(newConfig);
      };

      themeManager.setTheme(themeName);

      console.log('\n🎉 主题已切换完成！');
      console.log('\n💡 提示：');
      console.log('   - 主题配置已保存到 plumar.config.yml');
      console.log('   - 重启开发服务器后新主题将自动生效');
      console.log('   - 如果服务器正在运行，请重启: Ctrl+C 然后 npm run dev');

    } catch (error) {
      console.error(`❌ 设置主题失败: ${error.message}`);
    }
  }

  // 配置主题
  async configTheme(key, value) {
    if (!key) {
      // 显示当前主题配置
      await this.showThemeConfig();
      return;
    }

    if (!value) {
      console.error('❌ 请提供配置值');
      console.log('💡 用法: plumar theme config <key> <value>');
      return;
    }

    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      
      // 初始化 theme_config 如果不存在
      if (!config.theme_config) {
        config.theme_config = {};
      }

      // 处理不同类型的值
      let processedValue = value;
      if (value === 'true') processedValue = true;
      else if (value === 'false') processedValue = false;
      else if (value.match(/^\d+$/)) processedValue = parseInt(value);
      else if (value.match(/^\d+\.\d+$/)) processedValue = parseFloat(value);

      config.theme_config[key] = processedValue;
      configManager.saveConfig(config);

      console.log(`✅ 主题配置已更新: ${key} = ${JSON.stringify(processedValue)}`);

    } catch (error) {
      console.error(`❌ 配置主题失败: ${error.message}`);
    }
  }

  // 显示主题配置
  async showThemeConfig() {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      
      console.log('\n⚙️  当前主题配置:\n');
      
      if (config.theme_config && Object.keys(config.theme_config).length > 0) {
        this.displayObject(config.theme_config, '   ');
      } else {
        console.log('   (无自定义配置)');
      }
      
      console.log('\n💡 使用 `plumar theme config <key> <value>` 修改配置');
      console.log('');

    } catch (error) {
      console.error(`❌ 显示主题配置失败: ${error.message}`);
    }
  }

  // 创建新主题
  async createTheme(themeName) {
    if (!themeName) {
      console.error('❌ 请提供主题名称');
      console.log('💡 用法: plumar theme create <theme-name>');
      return;
    }

    try {
      const themesDir = join(process.cwd(), 'themes');
      const themePath = join(themesDir, themeName);

      if (existsSync(themePath)) {
        console.error(`❌ 主题 "${themeName}" 已存在`);
        return;
      }

      // 创建主题目录结构
      mkdirSync(themePath, { recursive: true });
      mkdirSync(join(themePath, 'layouts'), { recursive: true });
      mkdirSync(join(themePath, 'components'), { recursive: true });
      mkdirSync(join(themePath, 'styles'), { recursive: true });
      mkdirSync(join(themePath, 'public'), { recursive: true });

      // 创建主题信息文件
      const themeInfo = `name: "${themeName}"
version: "1.0.0"
description: "自定义主题"
author: "Your Name"
features:
  - "响应式设计"
  - "现代化UI"
`;
      writeFileSync(join(themePath, 'theme.info.yml'), themeInfo, 'utf8');

      // 创建主题配置文件
      const themeConfig = `# ${themeName} 主题配置

# 颜色配置
colors:
  primary: "#3b82f6"
  secondary: "#6b7280"
  accent: "#f59e0b"

# 布局配置
layout:
  header_fixed: true
  sidebar_position: "right"
  max_width: "1200px"

# 功能配置
features:
  dark_mode: true
  search: true
  comments: false
`;
      writeFileSync(join(themePath, 'theme.config.yml'), themeConfig, 'utf8');

      console.log(`✅ 主题 "${themeName}" 创建成功！`);
      console.log(`📁 主题路径: ${themePath}`);
      console.log('\n🚀 下一步:');
      console.log(`   1. 编辑 ${themeName}/layouts/ 中的布局文件`);
      console.log(`   2. 添加组件到 ${themeName}/components/`);
      console.log(`   3. 自定义样式在 ${themeName}/styles/`);
      console.log(`   4. 使用 \`plumar theme set ${themeName}\` 应用主题`);

    } catch (error) {
      console.error(`❌ 创建主题失败: ${error.message}`);
    }
  }

  // 验证主题
  async validateTheme(themeName) {
    if (!themeName) {
      console.error('❌ 请提供主题名称');
      console.log('💡 用法: plumar theme validate <theme-name>');
      return;
    }

    try {
      const themePath = join(process.cwd(), 'themes', themeName);
      const validator = new ThemeValidator();
      
      const result = validator.validate(themePath, themeName);
      
      if (result.isValid) {
        console.log('\n🚀 下一步：');
        console.log('   1. 使用 `plumar theme set ' + themeName + '` 应用主题');
        console.log('   2. 或运行 `plumar theme info ' + themeName + '` 查看详细信息');
      } else {
        console.log('\n🔧 修复建议：');
        console.log('   1. 确保主题目录结构正确');
        console.log('   2. 添加必需的布局文件');
        console.log('   3. 检查配置文件语法');
      }

    } catch (error) {
      console.error(`❌ 验证主题失败: ${error.message}`);
    }
  }



  // 辅助方法：显示对象
  displayObject(obj, indent = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        console.log(`${indent}${key}:`);
        this.displayObject(value, indent + '  ');
      } else if (Array.isArray(value)) {
        console.log(`${indent}${key}: [${value.join(', ')}]`);
      } else {
        console.log(`${indent}${key}: ${value}`);
      }
    }
  }

  showHelp() {
    console.log(`
🎨 theme 命令 - 主题管理

用法:
  plumar theme                      显示当前主题状态
  plumar theme list                 列出所有可用主题
  plumar theme info <theme>         查看主题详细信息
  plumar theme set <theme>          切换到指定主题
  plumar theme config [key] [value] 配置主题选项
  plumar theme create <theme>       创建新主题
  plumar theme validate <theme>     验证主题

示例:
  plumar theme list
  plumar theme set 2025Plumar       # 切换主题，重启服务器后生效
  plumar theme config colors.primary "#ff6b6b"
  plumar theme create my-theme
  plumar theme validate my-theme
`);
  }
} 