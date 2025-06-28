# Plumar

🚀 轻量级 Astro 博客生成工具 - 类似 Hexo 的现代化博客解决方案

## 特性

- ⚡ **轻量高效** - 零依赖，仅使用 Node.js 原生 API
- 📝 **类似 Hexo** - 熟悉的工作流程和命令行体验
- 🎯 **Astro 优化** - 专为 Astro 框架设计，完美集成
- 🏗️ **完整站点** - 一键初始化完整的博客项目
- 🚀 **即开即用** - 内置开发服务器和构建工具
- 📊 **功能丰富** - 文章管理、统计、发布等完整功能

## 安装

```bash
npm install -g plumar
```

或者本地开发：

```bash
git clone https://github.com/your-username/plumar.git
cd plumar
npm link
```

## 快速开始

### 1. 初始化新站点

```bash
plumar init my-blog
cd my-blog
```

### 2. 创建文章

```bash
# 创建新文章
plumar new "我的第一篇文章"

# 创建页面
plumar new page "关于我"

# 创建草稿
plumar new draft "未完成的想法"
```

### 3. 启动开发服务器

```bash
plumar server
# 或者
npm run dev
```

### 4. 构建和部署

```bash
# 构建静态站点
plumar build
# 或者
npm run build
```

## 命令详解

### init - 初始化站点

```bash
plumar init <site-name>         # 创建新的博客站点

# 示例
plumar init my-blog
plumar init tech-blog
```

### new - 创建内容

```bash
plumar new <title>              # 创建新文章
plumar new page <title>         # 创建新页面
plumar new draft <title>        # 创建草稿

# 选项
--tags <tags>                   # 标签 (逗号分隔)
--category <category>           # 分类 (逗号分隔)
--description <description>     # 描述
--layout <layout>               # 布局模板

# 示例
plumar new "技术分享" --tags "tech,blog" --category "tutorial"
```

### server - 开发服务器

```bash
plumar server                   # 启动开发服务器
plumar server --port 4000       # 指定端口
```

### build - 构建站点

```bash
plumar build                    # 构建静态站点到 dist/ 目录
```

### list - 列出文章

```bash
plumar list                     # 列出所有文章
plumar list --type draft       # 只显示草稿
plumar list --tag tech          # 按标签过滤
plumar list --detail           # 显示详细信息
```

### publish - 发布草稿

```bash
plumar publish <title>          # 发布指定草稿
```

### config - 配置管理

```bash
plumar config                   # 显示当前配置
plumar config set <key> <value> # 设置配置项
plumar config get <key>         # 获取配置项
```

### stats - 文章统计

```bash
plumar stats                    # 显示基本统计
plumar stats --detail          # 显示详细统计
```

## 工作流程

Plumar 遵循类似 Hexo 的工作流程：

1. **初始化站点**: `plumar init my-blog`
2. **进入站点目录**: `cd my-blog`
3. **创建内容**: `plumar new "文章标题"`
4. **本地预览**: `plumar server`
5. **构建部署**: `plumar build`

## 站点结构

初始化后的站点结构：

```
my-blog/
├── src/
│   ├── content/
│   │   ├── blog/          # 博客文章
│   │   └── config.ts      # 内容集合配置
│   └── pages/
│       ├── index.astro    # 首页
│       └── blog/          # 博客页面
├── templates/             # Plumar 模板
├── public/               # 静态资源
├── astro.config.mjs      # Astro 配置
├── plumar.config.js      # Plumar 配置
└── package.json
```

## 配置

`plumar.config.js` 配置文件：

```javascript
export default {
  siteName: "我的博客",
  contentDir: "./src/content/blog",
  templateDir: "./templates",
  dateFormat: "YYYY-MM-DD",
  filenameFormat: "YYYY-MM-DD-{slug}",
  defaultTags: ["blog"],
  defaultCategories: ["未分类"],
  language: "zh-CN",
  author: "Your Name",
  description: "基于 Astro 的博客站点",
  timezone: "Asia/Shanghai"
};
```

## 模板系统

Plumar 支持自定义模板。在 `templates/` 目录下创建：

- `post.md` - 文章模板
- `page.md` - 页面模板  
- `draft.md` - 草稿模板

模板语法：

```markdown
---
title: "{{title}}"
date: {{date}}
slug: "{{slug}}"
draft: {{draft}}
tags: []
categories: []
---

# {{title}}

在这里开始写作...
```

## 部署

构建后的文件在 `dist/` 目录中，可以部署到任何静态站点托管服务：

### Vercel
```bash
# 连接 GitHub 仓库自动部署
vercel --prod
```

### Netlify
```bash
# 拖拽 dist/ 文件夹到 Netlify
# 或使用 Netlify CLI
netlify deploy --prod --dir=dist
```

### GitHub Pages
在 `.github/workflows/deploy.yml` 中配置 GitHub Actions：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 开发 Plumar

```bash
# 克隆项目
git clone https://github.com/your-username/plumar.git
cd plumar

# 链接到全局
npm link

# 测试 CLI
plumar init test-blog
cd test-blog
plumar new "测试文章"
plumar server
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

🌟 如果这个项目对你有帮助，请给一个 Star！ 