# Plumar

轻量级的 Astro 博客命令行工具，采用类似 Hexo 的工作流程。

## 特性

- **零依赖设计** - 仅使用 Node.js 原生 API，无第三方依赖
- **熟悉的工作流** - 命令行操作参考 Hexo 设计，易于上手
- **Astro v5 适配** - 基于最新的 Content Layer API 实现
- **主题系统** - 内置主题管理，支持自定义和切换
- **完整的文章管理** - 创建、草稿、发布、列表、统计等功能

## 安装

```bash
npm install -g plumar
```

本地开发：

```bash
git clone https://github.com/Calderic/Plumar.git
cd plumar
npm link
```

## 快速开始

```bash
# 初始化博客站点
plumar init my-blog
cd my-blog
npm install

# 创建第一篇文章
plumar new "我的第一篇文章"

# 启动开发服务器
npm run dev

# 构建为静态站点
npm run build
```

访问 `http://localhost:4321` 预览站点。

## 命令说明

### 初始化站点

```bash
plumar init <site-name>
```

创建新的博客项目，自动生成完整的目录结构和配置文件。

### 创建内容

```bash
# 创建文章
plumar new "文章标题"

# 创建页面
plumar new page "关于页面"

# 创建草稿
plumar new draft "未完成的文章"
```

**选项参数：**
- `--tags` - 设置标签（逗号分隔）
- `--category` - 设置分类（逗号分隔）
- `--description` - 添加描述
- `--layout` - 指定布局模板

**示例：**
```bash
plumar new "Astro 入门教程" \
  --tags "astro,tutorial" \
  --category "前端开发" \
  --description "从零开始学习 Astro"
```

### 内容管理

```bash
plumar list                    # 列出所有文章
plumar list --type draft       # 仅显示草稿
plumar list --tag tech         # 按标签筛选
plumar publish "草稿标题"       # 发布草稿到正式文章
```

### 站点操作

```bash
plumar server                  # 启动开发服务器
plumar build                   # 构建静态站点
plumar stats                   # 查看站点统计
plumar config                  # 显示当前配置
```

### 主题管理

```bash
plumar theme list              # 列出可用主题
plumar theme use <name>        # 切换主题
plumar theme info <name>       # 查看主题信息
```

## 项目结构

初始化后的站点目录结构：

```
my-blog/
├── src/
│   ├── content/
│   │   └── blog/              # Markdown 文章目录
│   ├── pages/                 # Astro 页面
│   └── content.config.ts      # Content Layer 配置
├── themes/
│   └── 2025Plumar/            # 默认主题
├── templates/                 # 文章模板
├── public/                    # 静态资源
├── plumar.config.yml          # Plumar 配置
├── astro.config.mjs           # Astro 配置
├── package.json
└── tsconfig.json
```

## 配置文件

Plumar 使用 YAML 格式的配置文件 `plumar.config.yml`，采用类似 Hexo 的配置结构：

```yaml
# 站点信息
title: "我的博客"
subtitle: ""
description: "基于 Astro 和 Plumar 的博客站点"
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
render_drafts: false

# 分类和标签
default_category: "未分类"

# 日期格式
date_format: "YYYY-MM-DD"
time_format: "HH:mm:ss"

# 分页
per_page: 10

# 主题
theme: "2025Plumar"
```

### 主要配置项说明

- **source_dir** - 文章存放目录
- **new_post_name** - 新文章的文件名格式（支持变量：`:year`、`:month`、`:day`、`:title`）
- **permalink** - 文章的 URL 格式
- **theme** - 当前使用的主题名称
- **render_drafts** - 是否在开发时渲染草稿

## 主题系统

Plumar 内置主题管理功能，主题文件存放在站点的 `themes/` 目录下。

### 默认主题：2025Plumar

项目自带的现代化主题，特点包括：

- 响应式设计，适配移动端
- 深色模式支持
- 蓝色渐变视觉风格
- 代码高亮和语法支持
- 文章目录和搜索功能

### 主题操作

```bash
# 查看所有可用主题
plumar theme list

# 切换主题
plumar theme use <theme-name>

# 查看主题详细信息
plumar theme info <theme-name>
```

### 自定义主题

在 `themes/` 目录下创建新的主题文件夹，需要包含以下文件：

```
themes/my-theme/
├── theme.info.yml        # 主题元数据
├── theme.config.yml      # 主题配置（可选）
├── layouts/              # 布局文件
│   ├── BaseLayout.astro
│   └── PostLayout.astro
├── components/           # 组件（可选）
└── styles/              # 样式（可选）
```

修改 `plumar.config.yml` 中的 `theme` 字段切换主题。

## 部署

执行 `npm run build` 后，构建产物会生成到 `dist/` 目录，可以部署到任何静态网站托管服务。

### Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 中导入项目
3. Vercel 会自动识别 Astro 项目并完成部署

### Netlify

**方式一：拖拽部署**
- 直接将 `dist/` 文件夹拖到 Netlify 部署页面

**方式二：命令行部署**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages

在项目根目录创建 `.github/workflows/deploy.yml`：

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

### 其他平台

Cloudflare Pages、Railway、Render 等平台均支持 Astro 站点部署。

## 本地开发

如果你想参与 Plumar 的开发或进行功能定制：

```bash
# 克隆项目
git clone https://github.com/Calderic/Plumar.git
cd plumar

# 链接到全局命令
npm link

# 创建测试站点
plumar init test-blog
cd test-blog
npm install
plumar new "测试文章"
npm run dev
```

## 系统要求

- Node.js >= 16.0.0
- Astro >= 5.0.0（自动安装）

## 技术实现

- 零依赖，仅使用 Node.js 原生模块（fs、path、url 等）
- 自实现的 YAML 解析器
- 完善的错误处理和提示系统
- 基于 Astro Content Layer API 的内容管理

## 许可证

MIT License

## 参与贡献

欢迎提交 Issue 报告问题或提出新功能建议，也欢迎直接提交 Pull Request。

在提交代码前，请确保：
- 代码风格与项目保持一致
- 添加了必要的注释
- 测试了相关功能

## 相关项目

- [Astro](https://astro.build/) - 现代化的 Web 框架
- [Hexo](https://hexo.io/) - 快速、简洁的博客框架 