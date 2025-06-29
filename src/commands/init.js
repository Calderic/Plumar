import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parseArgs } from '../core/utils.js';

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
    // 创建目录结构
    const dirs = [
      '',
      'src',
      'src/content',
      'src/content/blog',
      'src/pages',
      'src/layouts',
      'src/components',
      'public',
      'templates'
    ];

    dirs.forEach(dir => {
      const fullPath = dir ? join(sitePath, dir) : sitePath;
      mkdirSync(fullPath, { recursive: true });
    });

    // 创建配置文件
    this.createConfigFiles(sitePath, siteName);
    
    // 创建模板文件
    this.createTemplateFiles(sitePath);
    
    // 创建 Astro 项目文件
    this.createAstroFiles(sitePath, siteName);
    
    // 创建示例文章
    this.createSamplePost(sitePath);
  }

  createConfigFiles(sitePath, siteName) {
    // 生成 Plumar 配置文件 - 简洁的 Hexo 风格
    const plumarConfig = `# Plumar 配置文件
# 基于 Hexo 配置格式设计，简洁实用

# 站点信息
title: "${siteName}"
subtitle: ""
description: "基于 Astro 和 Plumar 的博客站点"
keywords: []
author: ""
language: "zh-CN"
timezone: "Asia/Shanghai"

# URL 配置
url: "https://your-site.com"
root: "/"
permalink: ":year/:month/:day/:title/"

# 目录配置
source_dir: "src/content/blog"
public_dir: "dist"

# 写作配置
new_post_name: ":year-:month-:day-:title.md"
default_layout: "post"
filename_case: 0
render_drafts: false

# 分类和标签
default_category: "未分类"
category_map: {}
tag_map: {}

# 日期时间格式
date_format: "YYYY-MM-DD"
time_format: "HH:mm:ss"

# 分页配置
per_page: 10
pagination_dir: "page"

# 扩展配置
theme: "2025Plumar"
theme_config: {}
deploy: {}
`;

    writeFileSync(join(sitePath, 'plumar.config.yml'), plumarConfig);

    // package.json - 升级到 Astro v5
    const packageJson = {
      name: siteName,
      version: "1.0.0",
      description: `${siteName} - 基于 Astro 的博客站点`,
      type: "module",
      scripts: {
        "dev": "astro dev",
        "start": "astro dev",
        "build": "astro build",
        "preview": "astro preview",
        "astro": "astro",
        "sync": "astro sync"
      },
      dependencies: {
        "astro": "^5.0.0",
        "@astrojs/mdx": "^4.0.0"
      },
      devDependencies: {
        "@astrojs/check": "^0.9.0",
        "typescript": "^5.0.0"
      }
    };
    writeFileSync(join(sitePath, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf8');
  }

  createTemplateFiles(sitePath) {
    const templatesDir = join(sitePath, 'templates');
    
    // 文章模板
    const postTemplate = `---
title: "{{title}}"
date: {{date}}
slug: "{{slug}}"
draft: false
tags: []
categories: []
description: ""
---

# {{title}}

在这里开始写作你的博客文章...

## 小节标题

你可以在这里添加内容。

### 子标题

- 列表项 1
- 列表项 2
- 列表项 3

\`\`\`javascript
// 代码示例
console.log('Hello, Plumar!');
\`\`\`

> 这是一个引用块，可以用来突出重要信息。

---

**标签**: 请在 Front Matter 中添加相关标签  
**分类**: 请在 Front Matter 中设置分类`;

    writeFileSync(join(templatesDir, 'post.md'), postTemplate, 'utf8');

    // 页面模板
    const pageTemplate = `---
title: "{{title}}"
date: {{date}}
slug: "{{slug}}"
layout: "page"
---

# {{title}}

这是一个静态页面。

## 关于这个页面

在这里添加页面的主要内容。页面通常用于：

- 关于我
- 联系方式  
- 项目展示
- 友情链接
- 其他静态内容

## 联系信息

你可以在这里添加联系方式或其他相关信息。`;

    writeFileSync(join(templatesDir, 'page.md'), pageTemplate, 'utf8');

    // 草稿模板
    const draftTemplate = `---
title: "{{title}}"
date: {{date}}
slug: "{{slug}}"
draft: true
tags: []
categories: []
description: ""
---

# {{title}}

这是一篇草稿文章。

## 写作提示

- [ ] 完善文章大纲
- [ ] 添加具体内容
- [ ] 检查语法和拼写
- [ ] 添加相关标签和分类
- [ ] 准备发布

## 内容大纲

1. 引言
2. 主要内容
3. 总结

---

*注意: 这是草稿状态，不会在博客中显示。使用 \`plumar publish "{{title}}"\` 命令发布。*`;

    writeFileSync(join(templatesDir, 'draft.md'), draftTemplate, 'utf8');
  }

  createAstroFiles(sitePath, siteName) {
    // 创建配置读取工具
    const configUtilsPath = join(sitePath, 'src/utils');
    mkdirSync(configUtilsPath, { recursive: true });
    
    const configUtils = `import { readFileSync } from 'fs';
import { join } from 'path';

// 改进的 YAML 解析器
function parseYAML(yamlContent) {
  const lines = yamlContent.split('\\n');
  const result = {};
  let currentObj = result;
  const stack = [result];
  let currentIndent = 0;
  
  for (let line of lines) {
    line = line.replace(/\\s*#.*$/, ''); // 移除注释
    if (!line.trim()) continue;
    
    const indent = line.length - line.trimLeft().length;
    const trimmed = line.trim();
    
    // 处理层级变化
    if (indent < currentIndent) {
      // 回到上层级
      while (stack.length > 1 && indent < currentIndent) {
        stack.pop();
        currentIndent -= 2;
      }
      currentObj = stack[stack.length - 1];
      currentIndent = indent;
    }
    
    if (trimmed.endsWith(':')) {
      // 对象键
      const key = trimmed.slice(0, -1);
      
      if (indent > currentIndent) {
        // 进入新层级
        const newObj = {};
        currentObj[key] = newObj;
        stack.push(newObj);
        currentObj = newObj;
        currentIndent = indent;
      } else {
        // 同层级新对象
        currentObj[key] = {};
        stack.push(currentObj[key]);
        currentObj = currentObj[key];
      }
    } else if (trimmed.includes(':')) {
      // 键值对
      const [key, ...valueParts] = trimmed.split(':');
      let value = valueParts.join(':').trim();
      
      // 处理不同类型的值
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value === 'null') value = null;
      else if (value.match(/^\\d+$/)) value = parseInt(value);
      else if (value.match(/^\\d+\\.\\d+$/)) value = parseFloat(value);
      else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      else if (value === '[]') value = [];
      else if (value === '{}') value = {};
      
      currentObj[key.trim()] = value;
    } else if (trimmed.startsWith('-')) {
      // 数组项 - 这个简化版本不完全支持，但对于基本配置足够了
      // 在实际使用中，我们的配置主要是简单的键值对
    }
  }
  
  return result;
}

// 读取 Plumar 配置
export function getPlumarConfig() {
  try {
    const configPath = join(process.cwd(), 'plumar.config.yml');
    const yamlContent = readFileSync(configPath, 'utf8');
    const config = parseYAML(yamlContent);
    
    // 确保关键字段是正确的类型
    if (typeof config.keywords === 'string' && config.keywords === '[]') {
      config.keywords = [];
    }
    
    return config;
  } catch (error) {
    console.warn('无法读取 plumar.config.yml，使用默认配置');
    return {
      title: '我的博客',
      subtitle: '',
      description: '基于 Astro 和 Plumar 的博客站点',
      author: '',
      language: 'zh-CN',
      keywords: []
    };
  }
}`;
    writeFileSync(join(configUtilsPath, 'config.js'), configUtils, 'utf8');

    // astro.config.mjs - 更新为 Astro v5 配置，集成主题系统
    const astroConfig = `import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 读取 Plumar 配置
function getPlumarConfig() {
  try {
    const yamlContent = readFileSync('./plumar.config.yml', 'utf8');
    const lines = yamlContent.split('\\n');
    const config = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(':') && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim().replace(/['"]/g, '');
        config[key.trim()] = value;
      }
    }
    
    return config;
  } catch {
    return { url: 'https://your-site.com', theme: '2025Plumar' };
  }
}

// 主题集成插件
function plumarTheme() {
  const config = getPlumarConfig();
  const currentTheme = config.theme || '2025Plumar';
  
  return {
    name: 'plumar-theme',
    hooks: {
      'astro:config:setup': ({ config: astroConfig, addWatchFile }) => {
        // 监听主题文件变化
        const themePath = join(process.cwd(), 'themes', currentTheme);
        if (existsSync(themePath)) {
          addWatchFile(join(themePath, '**/*'));
        }
        
        // 添加主题别名
        astroConfig.vite.resolve = astroConfig.vite.resolve || {};
        astroConfig.vite.resolve.alias = astroConfig.vite.resolve.alias || {};
        
        // 设置主题组件别名
        const themeComponentsPath = join(themePath, 'components');
        if (existsSync(themeComponentsPath)) {
          astroConfig.vite.resolve.alias['@theme/components'] = themeComponentsPath;
        }
        
        // 设置主题布局别名
        const themeLayoutsPath = join(themePath, 'layouts');
        if (existsSync(themeLayoutsPath)) {
          astroConfig.vite.resolve.alias['@theme/layouts'] = themeLayoutsPath;
        }
        
        // 设置主题样式
        const themeStylesPath = join(themePath, 'styles');
        if (existsSync(themeStylesPath)) {
          astroConfig.vite.resolve.alias['@theme/styles'] = themeStylesPath;
        }
      }
    }
  };
}

const config = getPlumarConfig();

export default defineConfig({
  site: config.url || 'https://your-site.com',
  integrations: [mdx(), plumarTheme()],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true
    }
  },
  vite: {
    resolve: {
      alias: {
        '@': join(process.cwd(), 'src'),
        '@theme': join(process.cwd(), 'themes', config.theme || '2025Plumar')
      }
    }
  }
});`;
    writeFileSync(join(sitePath, 'astro.config.mjs'), astroConfig, 'utf8');

    // tsconfig.json - 更新为 Astro v5 推荐配置
    const tsConfig = {
      extends: "astro/tsconfigs/base",
      include: [".astro/types.d.ts", "**/*"],
      exclude: ["dist"]
    };
    writeFileSync(join(sitePath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2), 'utf8');

    // 主页面 - 使用主题布局
    const indexPage = `---
import { getPlumarConfig } from '../utils/config.js';
import { existsSync } from 'fs';
import { join } from 'path';

const config = getPlumarConfig();
const currentTheme = config.theme || '2025Plumar';

// 尝试导入主题布局
let DefaultLayout;
try {
  const themeLayoutPath = \`@theme/layouts/default.astro\`;
  DefaultLayout = (await import(themeLayoutPath)).default;
} catch {
  // 如果主题布局不存在，使用内置布局
  DefaultLayout = null;
}

const pageData = {
  title: config.title,
  description: config.description,
  author: config.author,
  language: config.language || 'zh-CN'
};
---

{DefaultLayout ? (
  <DefaultLayout {...pageData}>
    <main>
      <h1>欢迎来到 {config.title}</h1>
      <p>{config.description}</p>
      
      <h2>开始使用</h2>
      <ul>
        <li>使用 <code>plumar new "文章标题"</code> 创建文章</li>
        <li>使用 <code>plumar list</code> 查看所有文章</li>
        <li>使用 <code>npm run dev</code> 启动开发服务器</li>
      </ul>
      
      <h2>链接</h2>
      <ul>
        <li><a href="/blog">查看博客文章</a></li>
      </ul>
    </main>
  </DefaultLayout>
) : (
  <!-- 内置默认布局 -->
  <html lang={config.language || 'zh-CN'}>
    <head>
      <meta charset="utf-8" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <meta name="viewport" content="width=device-width" />
      <meta name="generator" content={Astro.generator} />
      <title>{config.title}</title>
      <meta name="description" content={config.description} />
      {config.author && <meta name="author" content={config.author} />}
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1 { color: #333; } h2 { color: #666; } code { background: #f5f5f5; padding: 0.2rem; }
      </style>
    </head>
    <body>
      <main>
        <h1>欢迎来到 {config.title}</h1>
        <p>{config.description}</p>
        
        <div style="background: #fff3cd; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
          <p><strong>注意:</strong> 当前主题 "{currentTheme}" 未找到，正在使用内置默认样式。</p>
          <p>请使用 <code>plumar theme create {currentTheme}</code> 创建主题，或使用 <code>plumar theme list</code> 查看可用主题。</p>
        </div>
        
        <h2>开始使用</h2>
        <ul>
          <li>使用 <code>plumar new "文章标题"</code> 创建文章</li>
          <li>使用 <code>plumar list</code> 查看所有文章</li>
          <li>使用 <code>npm run dev</code> 启动开发服务器</li>
        </ul>
        
        <h2>链接</h2>
        <ul>
          <li><a href="/blog">查看博客文章</a></li>
        </ul>
      </main>
    </body>
  </html>
)}`;
    writeFileSync(join(sitePath, 'src/pages/index.astro'), indexPage, 'utf8');

    // 博客列表页面 - 使用主题布局
    const blogIndexPage = `---
import { getCollection } from 'astro:content';
import { getPlumarConfig } from '../../utils/config.js';

const config = getPlumarConfig();
const posts = await getCollection('blog', ({ data }) => {
  return data.draft !== true;
});

posts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

// 尝试导入主题布局
let DefaultLayout;
try {
  DefaultLayout = (await import('@theme/layouts/default.astro')).default;
} catch {
  DefaultLayout = null;
}

const pageData = {
  title: \`博客文章 - \${config.title}\`,
  description: \`\${config.title}的博客文章列表\`,
  language: config.language || 'zh-CN'
};
---

{DefaultLayout ? (
  <DefaultLayout {...pageData}>
    <main>
      <h1>博客文章</h1>
      
      {posts.length === 0 ? (
        <p>还没有文章，使用 <code>plumar new "文章标题"</code> 创建第一篇文章。</p>
      ) : (
        posts.map((post) => (
          <article style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
            <h2>
              <a href={\`/blog/\${post.id}\`}>{post.data.title}</a>
            </h2>
            <p style="color: #666;">发布时间: {post.data.date.toLocaleDateString('zh-CN')}</p>
            {post.data.description && <p>{post.data.description}</p>}
            {post.data.tags.length > 0 && (
              <p style="font-size: 0.9rem;">
                <strong>标签:</strong> {post.data.tags.join(', ')}
              </p>
            )}
          </article>
        ))
      )}
      
      <p><a href="/">← 返回首页</a></p>
    </main>
  </DefaultLayout>
) : (
  <!-- 内置默认布局 -->
  <html lang={config.language || 'zh-CN'}>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
      <title>博客文章 - {config.title}</title>
      <meta name="description" content={\`\${config.title}的博客文章列表\`} />
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1, h2 { color: #333; } a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; } code { background: #f5f5f5; padding: 0.2rem; }
      </style>
    </head>
    <body>
      <main>
        <h1>博客文章</h1>
        
        {posts.length === 0 ? (
          <p>还没有文章，使用 <code>plumar new "文章标题"</code> 创建第一篇文章。</p>
        ) : (
          posts.map((post) => (
            <article style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
              <h2>
                <a href={\`/blog/\${post.id}\`}>{post.data.title}</a>
              </h2>
              <p style="color: #666;">发布时间: {post.data.date.toLocaleDateString('zh-CN')}</p>
              {post.data.description && <p>{post.data.description}</p>}
              {post.data.tags.length > 0 && (
                <p style="font-size: 0.9rem;">
                  <strong>标签:</strong> {post.data.tags.join(', ')}
                </p>
              )}
            </article>
          ))
        )}
        
        <p><a href="/">← 返回首页</a></p>
      </main>
    </body>
  </html>
)}`;
    // 确保目录存在
    mkdirSync(join(sitePath, 'src/pages/blog'), { recursive: true });
    writeFileSync(join(sitePath, 'src/pages/blog/index.astro'), blogIndexPage, 'utf8');

    // 文章详情页面 - 使用主题布局
    const postDetailPage = `---
import { getCollection, render } from 'astro:content';
import { getPlumarConfig } from '../../utils/config.js';

const config = getPlumarConfig();

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);

// 尝试导入主题文章布局，如果没有则使用默认布局
let PostLayout;
let DefaultLayout;
try {
  PostLayout = (await import('@theme/layouts/post.astro')).default;
} catch {
  try {
    DefaultLayout = (await import('@theme/layouts/default.astro')).default;
  } catch {
    PostLayout = null;
    DefaultLayout = null;
  }
}

const Layout = PostLayout || DefaultLayout;

const pageData = {
  title: \`\${post.data.title} - \${config.title}\`,
  description: post.data.description,
  author: config.author,
  language: config.language || 'zh-CN',
  // 文章特定数据
  post: post.data,
  content: Content
};
---

{Layout ? (
  <Layout {...pageData}>
    <article>
      <h1>{post.data.title}</h1>
      <p style="color: #666;">发布时间: {post.data.date.toLocaleDateString('zh-CN')}</p>
      {post.data.tags.length > 0 && (
        <p style="font-size: 0.9rem;">
          <strong>标签:</strong> {post.data.tags.join(', ')}
        </p>
      )}
      <hr style="margin: 2rem 0;" />
      <Content />
    </article>
    
    <hr style="margin: 2rem 0;" />
    <p>
      <a href="/blog">← 返回博客列表</a> | 
      <a href="/">返回首页</a>
    </p>
  </Layout>
) : (
  <!-- 内置默认布局 -->
  <html lang={config.language || 'zh-CN'}>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width" />
      <title>{post.data.title} - {config.title}</title>
      {post.data.description && <meta name="description" content={post.data.description} />}
      {config.author && <meta name="author" content={config.author} />}
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        h2, h3 { color: #555; } a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; } code { background: #f5f5f5; padding: 0.2rem; }
        pre { background: #f8f8f8; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
      </style>
    </head>
    <body>
      <main>
        <article>
          <h1>{post.data.title}</h1>
          <p style="color: #666;">发布时间: {post.data.date.toLocaleDateString('zh-CN')}</p>
          {post.data.tags.length > 0 && (
            <p style="font-size: 0.9rem;">
              <strong>标签:</strong> {post.data.tags.join(', ')}
            </p>
          )}
          <hr style="margin: 2rem 0;" />
          <Content />
        </article>
        
        <hr style="margin: 2rem 0;" />
        <p>
          <a href="/blog">← 返回博客列表</a> | 
          <a href="/">返回首页</a>
        </p>
      </main>
    </body>
  </html>
)}`;
    writeFileSync(join(sitePath, 'src/pages/blog/[slug].astro'), postDetailPage, 'utf8');

    // Content Collection 配置 - 使用新的 Content Layer API
    mkdirSync(join(sitePath, 'src'), { recursive: true });
    const contentConfig = `import { defineCollection, z } from 'astro:content';
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

export const collections = {
  blog,
};`;
    writeFileSync(join(sitePath, 'src/content.config.ts'), contentConfig, 'utf8');

    // README
    const readme = `# ${siteName}

基于 Astro v5 和 Plumar 的博客站点。

## 开始使用

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 开发

\`\`\`bash
# 启动开发服务器
npm run dev

# 创建新文章
plumar new "文章标题"

# 查看所有文章
plumar list

# 查看统计信息
plumar stats
\`\`\`

### 构建

\`\`\`bash
# 构建静态站点
npm run build

# 预览构建结果
npm run preview
\`\`\`

### 部署

构建后的文件在 \`dist/\` 目录中，可以部署到任何静态站点托管服务：

- **Vercel**: 连接 GitHub 仓库自动部署
- **Netlify**: 拖拽 \`dist/\` 文件夹或连接 Git
- **GitHub Pages**: 使用 GitHub Actions 自动构建部署
- **Cloudflare Pages**: 连接仓库自动部署

## 技术栈

- **Astro v5**: 现代静态站点生成器
- **Content Layer API**: Astro v5 的新内容管理 API
- **MDX**: 支持在 Markdown 中使用 JSX
- **TypeScript**: 类型安全的 JavaScript

## Plumar 命令

- \`plumar new <title>\` - 创建新文章
- \`plumar new page <title>\` - 创建新页面
- \`plumar new draft <title>\` - 创建草稿
- \`plumar list\` - 列出所有文章
- \`plumar publish <title>\` - 发布草稿
- \`plumar stats\` - 查看统计信息
- \`plumar config\` - 配置管理

## 目录结构

\`\`\`
${siteName}/
├── src/
│   ├── content/
│   │   ├── blog/          # 博客文章
│   │   └── content.config.ts  # 内容集合配置 (Astro v5)
│   ├── pages/
│   │   ├── index.astro    # 首页
│   │   └── blog/          # 博客页面
│   └── utils/
│       └── config.js      # Plumar 配置读取工具
├── templates/             # Plumar 模板
├── public/               # 静态资源
├── astro.config.mjs      # Astro 配置
├── plumar.config.yml     # Plumar 配置
└── package.json
\`\`\`

## 升级说明

此项目使用 Astro v5，相比 v4 有以下重要变化：

- 使用新的 Content Layer API 替代传统的 Content Collections
- 配置文件从 \`src/content/config.ts\` 移动到 \`src/content.config.ts\`
- 使用 \`render()\` 函数替代 \`post.render()\` 方法
- 升级到 \`@astrojs/mdx\` v4.0.0
- 移除了已弃用的 \`@astrojs/markdown-remark\`

更多信息请参考 [Astro v5 升级指南](https://docs.astro.build/en/guides/upgrade-to/v5/)。
`;
    writeFileSync(join(sitePath, 'README.md'), readme, 'utf8');

    // .gitignore
    const gitignore = `# Dependencies
node_modules/

# Build output
dist/

# Astro
.astro/

# Environment variables
.env
.env.local
.env.production

# macOS
.DS_Store

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*

# Cache
.cache/
`;
    writeFileSync(join(sitePath, '.gitignore'), gitignore, 'utf8');
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