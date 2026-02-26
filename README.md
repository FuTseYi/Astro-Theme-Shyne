## ✨ Astro-Theme-Shyne

一个基于 **Astro 5**、**Tailwind CSS 4** 和 **React/shadcn-style 组件** 的极简博客与作品集主题，适合用来搭建个人博客 / 个人站点。

在线预览 https://astro-theme-shyne.vercel.app

---

## ✨ 特性

- **技术栈**
  - 基于 [Astro](https://astro.build) 5、[React](https://react.dev) 组件与 [Tailwind CSS](https://tailwindcss.com)
  - 使用 `astro-icon` 与 Iconify 图标集（Lucide / Simple Icons）
- **内容与布局**
  - 内置首页、博客列表、文章页、标签页、项目页、关于页等基础页面
  - 支持博客、项目、经历等多类型内容：存放于 `src/content/blog`、`src/content/projects`、`src/content/experience`
  - 分页、精选文章 / 精选项目数量等可在 `src/config.ts` 中配置
- **Markdown 增强**
  - 支持 Emoji、数学公式（remark-math + rehype-katex）
  - 支持 GitHub 风格提示块（Admonitions），通过 remark/rehype 指令组件实现
  - 使用 Expressive Code + Shiki 提供代码高亮、折叠区块、行号等特性
- **样式与主题**
  - Tailwind CSS 4 + 自定义全局样式（见 `src/styles/*.css`）
  - 使用 CSS 变量与数据属性以适配浅色/深色等主题（可根据需要扩展）
- **其他功能**
  - 自动生成 RSS（`/rss.xml`）与 `robots.txt`
  - 预置 `sitemap` 集成
  - 预留从 Obsidian 导入博客内容的脚本与 `example.env` 配置

---

## 📦 环境要求

- **Node.js**：推荐 `>= 20`
- **包管理器**：推荐使用 `pnpm`（仓库中包含 `pnpm-lock.yaml`），也可以使用 `npm` / `yarn`

---

## 🚀 快速开始

1. **克隆项目**

```bash
git clone https://github.com/your-name/Astro-Theme-Shyne.git
cd Astro-Theme-Shyne
```

2. **安装依赖**

使用 pnpm（推荐）：

```bash
pnpm install
```

或使用 npm：

```bash
npm install
```

3. **本地开发**

```bash
pnpm dev
```

默认在 `http://localhost:1234` 运行（见 `astro.config.ts` 的 `server` 配置）。

4. **生产构建与预览**

```bash
# 构建（会先运行 astro check）
pnpm build

# 本地预览构建结果
pnpm preview
```

---

## ⚙️ 基本配置

- **站点信息与导航**：编辑 `src/config.ts`
  - `SITE`：站点标题、描述、作者、分页数量等
  - `FAVICON`：网站图标与应用标题
  - `HEADER_LINKS` / `FOOTER_LINKS`：头部与底部导航链接
  - `SOCIAL_LINKS`：社交链接与图标（GitHub、LinkedIn、X 等）

- **Astro / Markdown 配置**：见 `astro.config.ts`
  - `site`：站点基础 URL（用于 sitemap、RSS 等）
  - `integrations`：React、Sitemap、Icon 等集成
  - `markdown.remarkPlugins` / `markdown.rehypePlugins`：Emoji、公式、Admonitions、外链、Expressive Code、Shiki 等

---

## 📝 内容结构

- **博客文章**：`src/content/blog`
  - 每篇文章一个文件夹，使用 `index.md`，例如：

```markdown
---
title: 我的第一篇博客
description: 这是一篇关于 Astro 的文章
date: 2026-01-01
tags:
  - astro
order: 1
draft: false
---

正文内容……
```

- **项目 / 作品集**：`src/content/projects`
- **经历 / 时间线**：`src/content/experience`

可根据自己的需求自由添加字段，前端展示组件会从内容集合中读取相应属性。

---

## 🔧 常用命令

所有命令均在项目根目录下执行：

| 命令                              | 说明                                      |
| :-------------------------------- | :---------------------------------------- |
| `pnpm dev`                        | 启动本地开发服务器                        |
| `pnpm build`                      | 类型检查并构建生产版本                    |
| `pnpm preview`                    | 预览构建后的站点                          |
| `pnpm astro ...`                  | 直接调用 Astro CLI（如 `astro add`）      |
| `pnpm prettier`                   | 使用 Prettier 格式化代码                  |
| `pnpm import:obsidian`            | 从 Obsidian 笔记中导入 Markdown（实验性） |
| `pnpm import-and-commit:obsidian` | 导入 Obsidian 并自动提交（实验性）        |
| `pnpm publish:devto`              | 将文章发布到 dev.to（待完善）             |
| `pnpm publish:medium`             | 将文章发布到 Medium（待完善）             |

> Obsidian 相关脚本需要先复制 `example.env` 为 `.env`，并根据自身路径配置 `SOURCE_MARKDOWN_DIR` 等变量。

---

## 📦 部署

本项目是纯静态站点，可以部署到任意静态托管平台，例如：

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

基本流程（以 Vercel 为例）：

1. 在 GitHub 上创建仓库并推送代码  
2. 在 Vercel 新建项目，选择对应仓库  
3. 构建命令：`pnpm build`，输出目录：`dist`  
4. 如需自定义域名或环境变量，可在 Vercel 面板中进一步配置

---

## 📌 规划与扩展

当前版本仅包含基础博客 / 项目展示功能，后续可以按需扩展：

- 增加搜索功能、分类页面、归档页
- 增强主题切换（多配色方案）、动画效果等
- 完善与 Obsidian、dev.to、Medium 的联动脚本

欢迎根据自己的需求自由改造本主题，也可以在未来补充更详细的文档与示例。 

