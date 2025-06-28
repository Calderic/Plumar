import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { parseArgs } from '../core/utils.js';

export class ServerCommand {
  async execute(args) {
    const parsed = parseArgs(args);
    
    // 检查是否在站点目录中
    if (!this.isInSiteDirectory()) {
      console.error('❌ 请在 Plumar 站点目录中运行此命令');
      console.log('💡 提示: 使用 `plumar init <site-name>` 创建新站点');
      return;
    }

    const port = parsed.options.port || 3000;
    const host = parsed.options.host || 'localhost';
    
    console.log(`🚀 启动开发服务器...`);
    console.log(`📍 地址: http://${host}:${port}`);
    
    try {
      await this.startAstroServer(port, host);
    } catch (error) {
      console.error(`❌ 启动服务器失败: ${error.message}`);
      console.log('\n💡 请确保已安装依赖:');
      console.log('   npm install');
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
            reject(new Error('依赖安装失败'));
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
      reject(error);
    });

    astroProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Astro 进程退出，代码: ${code}`));
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