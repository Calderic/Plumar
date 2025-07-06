# 2025Plumar 主题

现代化蓝白风格博客主题，专为 Astro 5.0 和 Plumar 设计。

## 🎨 设计特色

- **现代扁平化设计** - 简洁明了的视觉体验
- **蓝白配色方案** - 专业而友好的配色
- **响应式布局** - 完美适配各种设备
- **深色模式支持** - 自动跟随系统偏好或手动切换
- **微动画效果** - 精心设计的交互动画
- **高性能优化** - 快速加载，流畅体验

## ✨ 功能特性

### 📱 用户体验
- 🌙 深色/浅色主题切换
- 🔍 全局搜索功能
- 📖 文章目录导航
- ⏰ 阅读时间估算
- 🔗 社交分享功能
- 📱 移动端友好
- ♿ 可访问性优化

### 🎯 性能优化
- ⚡ CSS 变量主题系统
- 🖼️ 图片懒加载
- 📦 代码分割
- 🎨 CSS 压缩
- 🚀 快速首屏渲染

### 🛠️ 开发者友好
- 📝 TypeScript 支持
- 🎨 CSS 变量定制
- 📐 组件化架构
- 🔧 配置文件驱动
- 📚 详细文档

## 🏗️ 文件结构

```
themes/2025Plumar/
├── theme.info.yml          # 主题信息
├── theme.config.yml        # 主题配置
├── README.md              # 说明文档
├── layouts/               # 布局文件
│   ├── BaseLayout.astro   # 基础布局
│   └── PostLayout.astro   # 文章布局
├── components/            # 组件文件
│   ├── Header.astro       # 页头组件
│   ├── Footer.astro       # 页脚组件
│   └── Navigation.astro   # 导航组件
└── styles/               # 样式文件
    ├── base.css          # 基础样式
    └── components.css    # 组件样式
```

## 🎛️ 配置选项

### 颜色系统

```yml
colors:
  primary: "#2563eb"        # 主色调
  secondary: "#64748b"      # 辅助色
  background: "#ffffff"     # 背景色
  text: "#0f172a"          # 文字色
  # ... 更多颜色选项
```

### 功能开关

```yml
features:
  dark_mode: true          # 深色模式
  search: true             # 搜索功能
  toc: true               # 文章目录
  back_to_top: true       # 返回顶部
  reading_time: true      # 阅读时间
  # ... 更多功能选项
```

### 布局设置

```yml
layout:
  max_width: "1200px"     # 最大宽度
  header_fixed: true      # 固定页头
  sidebar_enabled: false  # 侧边栏
  # ... 更多布局选项
```

## 📦 安装使用

### 通过 Plumar CLI

```bash
# 创建新项目时选择 2025Plumar 主题
plumar init my-blog --theme 2025Plumar

# 或在现有项目中切换主题
plumar theme use 2025Plumar
```

### 手动安装

1. 将主题文件复制到项目的 `themes/` 目录
2. 在 `plumar.config.yml` 中设置主题：

```yml
theme: "2025Plumar"
```

## 🎨 自定义样式

### CSS 变量

主题使用 CSS 变量系统，可以轻松自定义：

```css
:root {
  --color-primary: #your-color;
  --font-family: 'Your Font', sans-serif;
  --radius-md: 8px;
}
```

### 配置文件

编辑 `theme.config.yml` 来自定义主题：

```yml
colors:
  primary: "#your-primary-color"
typography:
  font_family: "'Your Font', sans-serif"
animations:
  enabled: true
  duration: "0.3s"
```

## 🔧 开发指南

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### 添加新组件

1. 在 `components/` 目录创建新的 `.astro` 文件
2. 使用一致的样式和命名规范
3. 添加相应的样式到 `styles/components.css`

### 修改布局

1. 编辑 `layouts/` 目录中的布局文件
2. 使用插槽系统保持灵活性
3. 确保响应式设计

## 📱 响应式断点

```css
/* 平板 */
@media (max-width: 768px) { }

/* 手机 */
@media (max-width: 480px) { }
```

## ♿ 可访问性

- 语义化 HTML 结构
- ARIA 标签支持
- 键盘导航友好
- 屏幕阅读器兼容
- 高对比度支持

## 🌐 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📄 许可证

MIT License - 详见 [LICENSE](../../../LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

- 📧 邮箱：support@plumar.dev
- 🐛 问题：[GitHub Issues](https://github.com/plumar/plumar/issues)
- 💬 讨论：[GitHub Discussions](https://github.com/plumar/plumar/discussions)

## 🚀 更新日志

### v1.0.0 (2025-01-03)

- ✨ 初始版本发布
- 🎨 现代化蓝白设计
- 🌙 深色模式支持
- 📱 响应式布局
- ⚡ 性能优化
- 🔧 完整配置系统

---

**2025Plumar** - 让您的博客更加现代化！