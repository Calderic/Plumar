import { mkdirSync, writeFileSync, existsSync, cpSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseArgs } from '../core/utils.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 使用 Hexo 风格的模板路径解析
function getTemplateRoot() {
  try {
    // 优先尝试从包根目录获取模板路径（npm 发布后的路径）
    const packageRoot = dirname(require.resolve('plumar/package.json'));
    const templatePath = join(packageRoot, 'templates');
    if (existsSync(templatePath)) {
      return templatePath;
    }
  } catch {
    // 如果是开发环境或 require.resolve 失败，使用相对路径
  }
  
  // 开发环境：从当前文件位置推算模板目录
  const devTemplatePath = join(__dirname, '..', '..', 'templates');
  if (existsSync(devTemplatePath)) {
    return devTemplatePath;
  }
  
  throw new Error('无法找到 Plumar 模板目录');
}

export class InitCommand {
  async execute(args) {
    const parsed = parseArgs(args);
    
    if (parsed._.length === 0) {
      console.error('❌ 请提供站点名称');
      this.showHelp();
      return;
    }

    const siteName = parsed._[0];
    const sitePath = join(process.cwd(), siteName);
    
    if (existsSync(sitePath)) {
      console.error(`❌ 目录 "${siteName}" 已存在`);
      return;
    }

    try {
      await this.createSiteStructure(sitePath, siteName);
      console.log(`✅ 博客站点 "${siteName}" 创建成功！`);
      console.log(`\n🚀 下一步:`);
      console.log(`   cd ${siteName}`);
      console.log(`   npm install  # 安装依赖`);
      console.log(`   plumar new "我的第一篇文章"`);
      console.log(`   npm run dev  # 启动开发服务器`);
      
    } catch (error) {
      console.error(`❌ 创建站点失败: ${error.message}`);
    }
  }

  async createSiteStructure(sitePath, siteName) {
    try {
      const templateRoot = getTemplateRoot();
      const projectTemplate = join(templateRoot, 'project');
      
      // 使用 Hexo 风格的模板复制
      cpSync(projectTemplate, sitePath, { 
        recursive: true,
        force: true 
      });
      
      // 处理模板变量替换
      this.processTemplateVariables(sitePath, siteName);
      
      // 创建额外的必要文件
      this.createAdditionalFiles(sitePath, siteName);
      
    } catch (error) {
      console.error(`使用模板创建项目失败: ${error.message}`);
      console.log('正在使用备用方案...');
      
      // 备用方案：手动创建基础结构
      this.createBasicStructure(sitePath, siteName);
    }
  }

  processTemplateVariables(sitePath, siteName) {
    // 处理需要变量替换的文件（检查多个可能的位置）
    const filesToProcess = [
      'plumar.config.yml',
      'config/plumar.config.yml',
      'package.json',
      'config/package.json'
    ];
    
    filesToProcess.forEach(fileName => {
      const filePath = join(sitePath, fileName);
      if (existsSync(filePath)) {
        let content = readFileSync(filePath, 'utf8');
        content = content.replace(/\{\{siteName\}\}/g, siteName);
        writeFileSync(filePath, content, 'utf8');
      }
    });

    // 将配置文件移动到根目录（如果在 config 目录中）
    const configInSubdir = join(sitePath, 'config', 'plumar.config.yml');
    const configInRoot = join(sitePath, 'plumar.config.yml');
    if (existsSync(configInSubdir) && !existsSync(configInRoot)) {
      const content = readFileSync(configInSubdir, 'utf8');
      writeFileSync(configInRoot, content, 'utf8');
    }

    const packageInSubdir = join(sitePath, 'config', 'package.json');
    const packageInRoot = join(sitePath, 'package.json');
    if (existsSync(packageInSubdir) && !existsSync(packageInRoot)) {
      const content = readFileSync(packageInSubdir, 'utf8');
      writeFileSync(packageInRoot, content, 'utf8');
    }
  }

  createAdditionalFiles(sitePath, siteName) {
    // 创建文章模板目录（如果不存在）
    const templatesDir = join(sitePath, 'templates');
    if (!existsSync(templatesDir)) {
      mkdirSync(templatesDir, { recursive: true });
    }

    // 从主项目复制模板文件到新项目的 templates 目录
    try {
      const sourceTemplatesDir = join(process.cwd(), 'templates');
      if (existsSync(sourceTemplatesDir)) {
        cpSync(sourceTemplatesDir, templatesDir, { recursive: true });
      }
    } catch (error) {
      console.warn('复制模板文件失败，将创建基础模板');
    }

    // 创建示例文章
    this.createSamplePost(sitePath);
    
    // 创建其他必要文件
    this.createEssentialFiles(sitePath);
  }

  createEssentialFiles(sitePath) {
    // 创建基本的配置文件（如果模板复制失败）
    const essentialFiles = {
      '.gitignore': `# Dependencies
node_modules/

# Build output
dist/

# Astro
.astro/

# Environment variables
.env*

# macOS
.DS_Store

# IDE
.vscode/
.idea/

# Logs
*.log

# Cache
.cache/`,
      
      'tsconfig.json': JSON.stringify({
        extends: "astro/tsconfigs/base",
        include: [".astro/types.d.ts", "**/*"],
        exclude: ["dist"]
      }, null, 2),
      
      'astro.config.mjs': `import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

// 读取 Plumar 配置来获取当前主题
function getCurrentTheme() {
  try {
    const configPath = join(process.cwd(), 'plumar.config.yml');
    if (!existsSync(configPath)) {
      return '2025Plumar';
    }
    
    const configContent = readFileSync(configPath, 'utf-8');
    const config = yaml.load(configContent);
    
    return config?.theme || '2025Plumar';
  } catch (error) {
    console.warn('读取主题配置失败，使用默认主题:', error.message);
    return '2025Plumar'; // 默认主题
  }
}

const currentTheme = getCurrentTheme();

export default defineConfig({
  integrations: [mdx()],
  vite: {
    resolve: {
      alias: {
        '@theme': new URL(\`./themes/\${currentTheme}\`, import.meta.url).pathname
      }
    }
  }
});`
    };
    
    Object.entries(essentialFiles).forEach(([fileName, content]) => {
      const filePath = join(sitePath, fileName);
      if (!existsSync(filePath)) {
        writeFileSync(filePath, content, 'utf8');
      }
    });
  }

  createBasicStructure(sitePath, siteName) {
    // 备用方案：创建最基本的项目结构
    console.log('正在创建基础项目结构...');
    
    // 创建基本目录结构
    const dirs = [
      'src/content/blog',
      'src/pages',
      'public'
    ];

    dirs.forEach(dir => {
      mkdirSync(join(sitePath, dir), { recursive: true });
    });

    // 创建基础配置文件
    const basicConfig = {
      'plumar.config.yml': `title: "${siteName}"
description: "基于 Astro 和 Plumar 的博客站点"
url: "https://your-site.com"
theme: "2025Plumar"`,
      
      'package.json': JSON.stringify({
        name: siteName,
        version: "1.0.0",
        type: "module",
        scripts: {
          "dev": "astro dev",
          "build": "astro build"
        },
        dependencies: {
          "astro": "^5.10.1",
          "@astrojs/mdx": "^4.3.0",
          "js-yaml": "^4.1.0"
        },
        devDependencies: {
          "@astrojs/check": "^0.9.4",
          "typescript": "^5.8.3"
        }
      }, null, 2),

      'src/content.config.ts': `import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    slug: z.string(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    description: z.string().default(''),
  }),
});

export const collections = { blog };`,

      'src/pages/index.astro': `---
// 简化版首页
---
<html lang="zh-CN">
  <head>
    <title>${siteName}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
    <h1>欢迎来到 ${siteName}</h1>
    <p>这是使用 Plumar 创建的博客站点。</p>
    <p><a href="/blog">查看博客文章</a></p>
  </body>
</html>`
    };

    Object.entries(basicConfig).forEach(([fileName, content]) => {
      writeFileSync(join(sitePath, fileName), content, 'utf8');
    });

    this.createEssentialFiles(sitePath);
    this.createSamplePost(sitePath);
  }

  createSamplePost(sitePath) {
    const samplePost = `---
title: "欢迎使用 Plumar"
date: "${new Date().toISOString().split('T')[0]}"
slug: "welcome-to-plumar"
draft: false
tags: ["plumar", "astro", "博客"]
categories: ["教程"]
description: "这是一篇示例文章，展示 Plumar 和 Astro v5 的基本功能。"
---

# 欢迎使用 Plumar

恭喜！您已经成功创建了一个基于 Astro v5 和 Plumar 的博客站点。

## 🚀 快速开始

### 创建文章

使用以下命令创建新文章：

\`\`\`bash
plumar new "我的第一篇文章"
\`\`\`

### 查看文章

\`\`\`bash
plumar list
\`\`\`

### 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

然后访问 http://localhost:4321 查看您的博客。

## ✨ 新特性

### Astro v5

本站点使用最新的 Astro v5，带来了以下改进：

- **Content Layer API**: 更强大的内容管理
- **更好的性能**: 构建速度提升 5 倍
- **Server Islands**: 混合静态和动态内容
- **类型安全**: 更好的 TypeScript 支持

### Plumar 命令

- \`plumar new <title>\` - 创建文章
- \`plumar new page <title>\` - 创建页面  
- \`plumar new draft <title>\` - 创建草稿
- \`plumar list\` - 列出文章
- \`plumar publish <title>\` - 发布草稿
- \`plumar stats\` - 查看统计

## 📝 Markdown 支持

支持完整的 Markdown 语法和 MDX：

### 代码高亮

\`\`\`javascript
function hello() {
  console.log('Hello, Astro v5!');
}
\`\`\`

### 表格

| 特性 | Astro v4 | Astro v5 |
|------|----------|----------|
| 构建速度 | 快 | 超快 |
| 内容 API | Content Collections | Content Layer |
| 性能 | 好 | 更好 |

### 引用

> Astro v5 是迄今为止最快、最强大的版本！

## 🎯 下一步

1. 编辑 \`plumar.config.yml\` 配置您的站点
2. 修改 \`src/pages/index.astro\` 自定义首页
3. 在 \`src/content/blog/\` 中添加更多文章
4. 运行 \`npm run build\` 构建站点

祝您使用愉快！🎉`;

    mkdirSync(join(sitePath, 'src/content/blog'), { recursive: true });
    writeFileSync(join(sitePath, 'src/content/blog/welcome-to-plumar.md'), samplePost, 'utf8');
  }

  showHelp() {
    console.log(`
🏗️  init 命令 - 初始化新的博客站点

用法:
  plumar init <site-name>

参数:
  site-name             站点名称和目录名

示例:
  plumar init my-blog
  plumar init tech-blog

创建的站点结构:
  - Astro 项目配置
  - Plumar 配置和模板
  - 示例文章和页面
  - 完整的开发环境
`);
  }
} 