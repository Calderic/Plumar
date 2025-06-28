import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { parseArgs } from '../core/utils.js';

export class BuildCommand {
  async execute(args) {
    const parsed = parseArgs(args);
    
    // 检查是否在站点目录中
    if (!this.isInSiteDirectory()) {
      console.error('❌ 请在 Plumar 站点目录中运行此命令');
      console.log('💡 提示: 使用 `plumar init <site-name>` 创建新站点');
      return;
    }

    console.log('🏗️  开始构建静态站点...');
    
    try {
      await this.buildSite();
      console.log('✅ 构建完成！');
      console.log('📁 构建文件位于 dist/ 目录');
      console.log('\n🚀 部署选项:');
      console.log('   - Vercel: 连接 GitHub 仓库自动部署');
      console.log('   - Netlify: 拖拽 dist/ 文件夹');
      console.log('   - GitHub Pages: 使用 GitHub Actions');
      console.log('   - Cloudflare Pages: 连接仓库自动部署');
      
    } catch (error) {
      console.error(`❌ 构建失败: ${error.message}`);
      console.log('\n💡 请确保已安装依赖:');
      console.log('   npm install');
    }
  }

  isInSiteDirectory() {
    return existsSync('plumar.config.yml') && 
           existsSync('astro.config.mjs') && 
           existsSync('package.json');
  }

  async buildSite() {
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
            this.runBuild(resolve, reject);
          } else {
            reject(new Error('依赖安装失败'));
          }
        });
      } else {
        this.runBuild(resolve, reject);
      }
    });
  }

  runBuild(resolve, reject) {
    const buildProcess = spawn('npx', ['astro', 'build'], {
      stdio: 'inherit',
      shell: true
    });

    buildProcess.on('error', (error) => {
      reject(error);
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`构建进程退出，代码: ${code}`));
      }
    });
  }

  showHelp() {
    console.log(`
🏗️  build 命令 - 构建静态站点

用法:
  plumar build

功能:
  - 构建 Astro 静态站点
  - 生成可部署的文件到 dist/ 目录
  - 自动安装依赖（如果需要）

部署方式:
  1. 上传 dist/ 目录到任何静态托管服务
  2. 使用 Git 连接自动部署服务
  3. 使用 CI/CD 自动化部署

注意:
  - 必须在 Plumar 站点目录中运行
  - 构建前会检查并安装依赖
`);
  }
} 