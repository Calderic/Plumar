import { InitCommand } from './commands/init.js';
import { NewCommand } from './commands/new.js';
import { ListCommand } from './commands/list.js';
import { PublishCommand } from './commands/publish.js';
import { ConfigCommand } from './commands/config.js';
import { StatsCommand } from './commands/stats.js';
import { ServerCommand } from './commands/server.js';
import { BuildCommand } from './commands/build.js';
import { ThemeCommand } from './commands/theme.js';
import { ErrorHandler } from './core/error-handler.js';
import { PlumarError } from './core/plumar-error.js';

export class CLI {
  constructor(version) {
    this.version = version;
    this.commands = new Map([
      ['init', new InitCommand()],
      ['new', new NewCommand()],
      ['list', new ListCommand()],
      ['publish', new PublishCommand()],
      ['config', new ConfigCommand()],
      ['stats', new StatsCommand()],
      ['server', new ServerCommand()],
      ['build', new BuildCommand()],
      ['theme', new ThemeCommand()],
    ]);
  }

  async run(args) {
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
      this.showHelp();
      return;
    }

    if (args.includes('--version') || args.includes('-v')) {
      console.log(`plumar v${this.version}`);
      return;
    }

    const commandName = args[0];
    const command = this.commands.get(commandName);

    if (!command) {
      ErrorHandler.handle(
        PlumarError.argumentError(`未知命令: ${commandName}`, commandName)
      );
      return;
    }

    try {
      await ErrorHandler.safeExecute(
        () => command.execute(args.slice(1)),
        `${commandName} 命令`,
        true
      );
    } catch (error) {
      ErrorHandler.handle(error);
    }
  }

  showHelp() {
    console.log(`
🚀 Plumar v${this.version} - 轻量级 Astro 博客文章生成工具

用法:
  plumar <command> [options]

命令:
  init <site-name>      初始化新的博客站点
  new <title>           创建新文章
  new page <title>      创建新页面  
  new draft <title>     创建草稿
  list                  列出所有文章
  publish <title>       发布草稿
  config                配置管理
  stats                 文章统计
  server                启动开发服务器
  build                 构建静态站点
  theme                 主题管理

选项:
  -h, --help           显示帮助信息
  -v, --version        显示版本号

示例:
  plumar init my-blog           # 初始化新站点
  cd my-blog                    # 进入站点目录
  plumar new "我的第一篇文章"    # 创建文章
  plumar server                 # 启动开发服务器
  plumar build                  # 构建站点

更多信息请访问: https://github.com/plumar/plumar
`);
  }
} 
