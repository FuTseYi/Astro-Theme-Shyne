# Astro Theme Shyne ✨

<!-- Badges -->
<div align="center">

[![Astro](https://img.shields.io/badge/Astro-5.x-FF5A03?style=flat&logo=astro)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-4FD1C5.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js->=20-339933?style=flat&logo=node.js)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-F69220?style=flat&logo=pnpm)](https://pnpm.io)
[![GitHub Stars](https://img.shields.io/github/stars/FuTseYi/Astro-Theme-Shyne?style=flat&logo=github)](https://github.com/FuTseYi/Astro-Theme-Shyne/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/FuTseYi/Astro-Theme-Shyne?style=flat&logo=github)](https://github.com/FuTseYi/Astro-Theme-Shyne/network)

</div>

---

## 简介 / Introduction

[English](#english) | [中文](#中文)

### English

A **minimalist**, **opinionated** blog + portfolio theme built with **Astro 5**, **Tailwind CSS 4**, and **React / shadcn-style components**. Perfect for building personal blogs, portfolios, or resume sites.

**Key Feature - Photo Gallery**: Unique **Polaroid-style** photo timeline that makes your travel photos and memories stand out with beautiful card layouts and lightbox viewing.

### 中文

一个基于 **Astro 5**、**Tailwind CSS 4** 和 **React / shadcn 风格组件** 的极简博客 + 作品集主题，适合用于搭建个人博客、个人主页、作品集站点。

**核心亮点 - 相册功能**: 独特的 **Polaroid 风格照片时间线**，让您的旅行照片和生活回忆以精美的卡片布局和灯箱预览方式脱颖而出。

---

## 特性 / Features

### 🎯 核心功能

| 功能 / Feature | 描述 / Description |
|:---------------|:------------------|
| **静态站点生成** | 基于 Astro 5 的 SSG 模式，零 JS 加载，高性能 |
| **博客系统** | 支持多章节长文、子文章、标签、阅读时间计算 |
| **作品集展示** | 项目卡片、时间线布局、精选项目标记 |
| **Polaroid 相册** ✨ | 独特的宝丽来风格照片时间线，灯箱预览 |
| **主题切换** | 浅色/深色模式，支持 Tailwind CSS 4 变量 |
| **SEO 优化** | RSS、Sitemap、Meta 标签、Open Graph |
| **即时搜索** | 前端即时搜索，无需后端服务 |

### 🛠️ 技术栈

- **Astro 5** - 静态站点框架
- **React 19** - 交互式组件
- **Tailwind CSS 4** - 原子化 CSS
- **TypeScript** - 类型安全
- **shadcn/ui 风格** - 现代化 UI 组件
- **Expressive Code** - 代码高亮与增强

### 📱 页面路由

| 路由 / Route | 描述 / Description |
|:-------------|:-------------------|
| `/` | 首页 - 个人简介、经历、项目、文章 |
| `/blog` | 博客列表 - 按年份分组 |
| `/blog/[id]` | 博客详情 - 支持子文章 |
| `/projects` | 项目作品列表 |
| `/photos` | **Polaroid 相册时间线** ✨ |
| `/experience` | 经历时间线 |
| `/about` | 关于页面 |
| `/tags` | 标签云 |
| `/search` | 即时搜索 |

---

## 在线预览 / Live Demo

- 🌐 **主站点**: [shyne.xieyi.org](https://shyne.xieyi.org)
- 🌐 **Vercel Demo**: [shyne.vercel.app](https://shyne.vercel.app)
- 🌐 **主题演示**: [astro-theme-shyne.vercel.app](https://astro-theme-shyne.vercel.app)

---

## 快速开始 / Quick Start

### 1. 克隆项目

```bash
git clone https://github.com/FuTseYi/Astro-Theme-Shyne.git
cd Astro-Theme-Shyne
```

### 2. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问: [http://localhost:1234](http://localhost:1234)

### 4. 构建生产版本

```bash
pnpm build
pnpm preview
```

---

## 配置 / Configuration

### 站点配置

编辑 `src/config.ts` 自定义站点信息：

```typescript
export const SITE: Site = {
  title: 'Your Site Name',
  description: 'Your site description for SEO',
  href: 'https://your-domain.com',
  author: 'Your Name',
  // ... more options
}
```

### 环境变量

复制示例环境文件：

```bash
cp example.env .env
```

---

## 内容管理 / Content Management

项目使用 **Astro Content Collections** 管理内容，类型安全且易于扩展。

### 博客文章

```markdown
---
title: 我的第一篇博客
description: 文章描述
date: 2026-01-01
tags:
  - astro
  - tutorial
draft: false
---

文章内容...
```

### 项目

```markdown
---
name: 项目名称
description: 项目简介
startDate: 2024-01-01
endDate: 2024-06-01
sourceCodeLink: https://github.com/...
siteLink: https://...
tags:
  - react
  - typescript
featured: true
---
```

### Polaroid 相册 ✨

这是本主题的核心亮点功能！创建难忘回忆的时间线：

```markdown
---
title: 东京之旅
description: 2025年春季东京行
startDate: 2025-04-01
endDate: 2025-04-07
favicon: 🌸
location: Tokyo, Japan
---

![](./assets/photo1.jpg)
![](./assets/photo2.jpg)
```

**相册特性：**
- 📸 Polaroid 风格卡片展示
- 🖼️ 点击放大灯箱预览
- 🎨 支持 Emoji/颜色/数字/图片图标
- 📍 地点信息展示
- 📅 时间线倒序排列

---

## 部署 / Deployment

### Vercel (推荐)

```bash
# 1. 推送到 GitHub
git init
git add .
git commit -m "Initial commit"
git push -u origin main

# 2. 在 Vercel 导入项目
# Build Command: pnpm build
# Output Directory: dist
```

### 其他平台

- **Netlify** - Build: `pnpm build`, Output: `dist`
- **Cloudflare Pages** - 同上
- **GitHub Pages** - 需要配置 GitHub Actions

---

## 技术细节 / Technical Details

### 依赖版本

| 包 / Package | 版本 / Version |
|:-------------|:---------------|
| Astro | ^5.16.15 |
| React | 19.2.3 |
| Tailwind CSS | ^4.1.18 |
| TypeScript | ^5.9.3 |
| Node.js | >=20 |

### 目录结构

```
Astro-Theme-Shyne/
├── src/
│   ├── components/     # React/Astro 组件
│   ├── content/        # 内容集合
│   │   ├── blog/      # 博客文章
│   │   ├── projects/  # 项目作品
│   │   ├── experience/# 经历时间线
│   │   └── photos/    # 相册时间线 ✨
│   ├── layouts/       # 页面布局
│   ├── lib/           # 工具函数
│   ├── pages/         # 路由页面
│   └── styles/        # 全局样式
├── public/            # 静态资源
├── astro.config.ts    # Astro 配置
├── tailwind.config.ts # Tailwind 配置 (可选)
└── package.json
```

---

## 贡献 / Contributing

欢迎贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

---

## 许可证 / License

MIT License - 查看 [LICENSE](LICENSE) 了解详情。

---

## 致谢 / Acknowledgments

- [Astro](https://astro.build) - 强大的静态站点框架
- [Tailwind CSS](https://tailwindcss.com) - 美观的 CSS 框架
- [shadcn/ui](https://ui.shadcn.com) - 优秀的 UI 组件设计
- [Expressive Code](https://expressive-code.com) - 代码块增强

---

## 常见问题 / FAQ

### Q: 如何更换主题颜色？

A: 编辑 `src/styles/global.css` 中的 CSS 变量，或修改 `tailwind.config.js` 中的配色方案。

### Q: 如何添加自定义字体？

A: 在 `src/layouts/Layout.astro` 中引入字体，并在 `global.css` 中定义字体变量。

### Q: 相册支持哪些图片格式？

A: 支持 PNG、JPG、JPEG、GIF、WebP、AVIF、SVG。

### Q: 如何禁用某个页面？

A: 在 `src/config.ts` 的 `HEADER_LINKS` 中注释掉对应链接，或删除 `src/pages/` 下的对应文件。

---

<div align="center">

**如果这个项目对你有帮助，请 ⭐ Star 支持！**

Made with ❤️ by [FuTseYi](https://github.com/FuTseYi)

</div>
