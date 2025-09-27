import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { parseArgs } from '../core/utils.js';
import { PlumarError } from '../core/plumar-error.js';
import { ERROR_CODES } from '../constants.js';

export class ServerCommand {
  async execute(args) {
    const parsed = parseArgs(args);
    
    // 检查是否在站点目录中
    if (!this.isInSiteDirectory()) {
      throw PlumarError.siteNotFound(process.cwd());
    }

    const port = parsed.options.port || 3000;
    const host = parsed.options.host || 'localhost';
    
    console.log(`🚀 启动开发服务器...`);
    console.log(`📍 地址: http://${host}:${port}`);
    
    try {
      await this.startAstroServer(port, host);
    } catch (error) {
      if (error instanceof PlumarError) {
        throw error;
      }
      throw new PlumarError(
        `启动开发服务器失败: ${error.message}`,
        ERROR_CODES.UNKNOWN_ERROR,
        [
          '确认已执行 `npm install` 安装依赖',
          '确保 Astro CLI 可以通过 npx 调用',
          '检查端口是否被其他进程占用'
        ],
        error
      );
    }
  }

  isInSiteDirectory() {
    return existsSync('plumar.config.yml') && 
           existsSync('astro.config.mjs') && 
           existsSync('package.json');
  }

  async startAstroServer(port, host) {
    return new Promise((resolve, reject) => {
      // 检查是否安装了依赖
      if (!existsSync('node_modules')) {
        console.log('📦 检测到未安装依赖，正在安装...');
        const installProcess = spawn('npm', ['install'], {
          stdio: 'inherit',
          shell: true
        });

        installProcess.on('close', (code) => {
          if (code === 0) {
            this.runAstroServer(port, host, resolve, reject);
          } else {
            reject(
              PlumarError.fileOperationError(
                '安装依赖',
                join(process.cwd(), 'package.json'),
                new Error('npm install 失败')
              )
            );
          }
        });
      } else {
        this.runAstroServer(port, host, resolve, reject);
      }
    });
  }

  runAstroServer(port, host, resolve, reject) {
    const astroProcess = spawn('npx', ['astro', 'dev', '--port', port, '--host', host], {
      stdio: 'inherit',
      shell: true
    });

    astroProcess.on('error', (error) => {
      if (error instanceof PlumarError) {
        reject(error);
      } else {
        reject(
          new PlumarError(
            `Astro 开发服务器异常: ${error.message}`,
            ERROR_CODES.UNKNOWN_ERROR,
            [
              '确认已安装 Astro CLI',
              '检查 Node.js 版本是否满足要求',
              '可尝试删除 node_modules 后重新安装'
            ],
            error
          )
        );
      }
    });

    astroProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new PlumarError(
            `Astro 进程退出，代码: ${code}`,
            ERROR_CODES.UNKNOWN_ERROR,
            [
              '查看终端输出了解具体错误原因',
              '确保项目依赖安装完整',
              '如多次失败，可尝试重新初始化项目'
            ]
          )
        );
      }
    });

    // 处理 Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n👋 正在关闭开发服务器...');
      astroProcess.kill('SIGINT');
      process.exit(0);
    });
  }

  showHelp() {
    console.log(`
🚀 server 命令 - 启动开发服务器

用法:
  plumar server [options]

选项:
  --port <port>         端口号 (默认: 3000)
  --host <host>         主机地址 (默认: localhost)

示例:
  plumar server
  plumar server --port 4000
  plumar server --host 0.0.0.0 --port 8080

注意:
  - 必须在 Plumar 站点目录中运行
  - 如果未安装依赖，会自动运行 npm install
`);
  }
} 
