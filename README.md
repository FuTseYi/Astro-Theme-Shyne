## ✨ Astro-Theme-Shyne

一个基于 **Astro 5**、**Tailwind CSS 4** 和 **React / shadcn 风格组件** 的极简博客 + 作品集主题，适合用于搭建个人博客、个人主页、作品集站点。

在线预览：
  - https://shyne.xieyi.org
  - https://shyne.vercel.app
  - https://astro-theme-shyne.vercel.app

---

## ✨ 功能总览

- **技术栈与架构**
  - **Astro 5**：所有页面为静态生成（SSG），支持少量交互组件。
  - **React + shadcn 风格组件**：在 `src/components/ui` 中提供按钮、分页、滚动区域等基础 UI。
  - **Tailwind CSS 4**：通过 `@tailwindcss/vite` + `src/styles/*.css` 组织全局样式与排版。
  - **图标系统**：使用 `astro-icon` + Iconify（Lucide / Simple Icons）统一管理图标。

- **站点页面与路由**
  - **首页** `/`
    - 个人简介 Hero 区域（头像、标语、按钮、社交链接）。
    - 近期经历时间线（来自 `src/content/experience`）。
    - 精选项目列表（来自 `src/content/projects`，支持 `featured`）。
    - 最新博客文章列表（来自 `src/content/blog`）。
  - **博客列表页** `/blog`
    - 按年份分组显示文章。
    - 支持分页（页数由 `SITE.postsPerPage` 控制）。
    - 右侧（桌面端）或底部（移动端）展示热门标签云。
  - **博客详情页** `/blog/[id]`
    - 支持**子文章（Subposts）结构**，适合多章节长文。
    - 自动生成文章目录（TOC），并在侧边栏与顶部展示。
    - 自动计算阅读时间，支持「当前文章 + 所有子文章总阅读时间」。
    - 支持标签 Badge、上一篇 / 下一篇导航、返回父文章导航。
    - 内置阅读进度环（右下角浮动按钮），显示阅读百分比并可一键回到顶部。
  - **标签总览页** `/tags`
    - 展示所有标签及其文章数量。
  - **标签详情页** `/tags/[id]`
    - 展示对应标签下的全部文章列表。
  - **项目列表页** `/projects`
    - 按年份（项目 `startDate`）分组。
    - 支持分页（由 `SITE.projectsPerPage` 控制）。
  - **项目详情页** `/projects/[id]`
    - 展示单个项目详细信息（时间、标签、链接等）。
    - 提供返回项目列表的按钮。
  - **经验时间线页** `/experience`
    - 以时间线形式展示学习 / 工作 / 实习经历。
  - **照片时间线页** `/photos`
    - 以时间线 + Polaroid 风格卡片展示相片集合。
    - 支持多张图片、地点、时间、图标样式等。
  - **关于页** `/about`
    - 「关于我」页：头图 + 多段介绍（个人简介 / 技能 / 爱好等）。
  - **搜索页** `/search`
    - 基于前端的**即时搜索**（不依赖后端服务）。
    - 同时搜索**文章**与**项目**，按标题 / 描述 / 标签匹配。
  - **RSS & SEO**
    - `/rss.xml`：自动生成 RSS 订阅源。
    - `/robots.txt`：自动生成 robots 配置，指向 sitemap。
    - `/sitemap-index.xml`：由 `@astrojs/sitemap` 自动生成。
  - **其他**
    - `404` 页面。
    - `favicon`、字体、图片等静态资源。

- **内容模型与集合（Content Collections）**
  - 使用 `src/content.config.ts` 定义四个集合：
    - **blog**：博客文章。
    - **projects**：项目 / 作品。
    - **experience**：经历 / 时间线。
    - **photos**：照片时间线。
  - 每个集合都有清晰的 frontmatter 字段校验（基于 `zod`），可以在写内容时保证结构统一。

- **Markdown 增强**
  - **Emoji 支持**：`remark-emoji`，直接在 Markdown 中写 `:smile:` 等。
  - **数学公式**：`remark-math` + `rehype-katex`，支持行内与块级公式。
  - **GitHub 风格提示块（Admonitions）**：
    - 支持 `:::note` / `:::tip` / `:::warning` 等语法。
    - 通过自定义 remark / rehype 插件自动渲染为美观提示组件。
  - **代码高亮与附加功能**：
    - `rehype-expressive-code` + `@expressive-code/*` + `@shikijs/rehype`。
    - 支持代码行号、折叠区块、浅色 / 深色主题自动切换等。

- **主题与样式**
  - Tailwind CSS 4 + 自定义 `global.css` / `typography.css` / `misc.css`。
  - 使用 CSS 变量 + `data-theme` 属性适配浅色 / 深色模式。
  - 提供 `ThemeToggle` 组件切换主题（在头部布局中使用）。

- **SEO 与访问体验**
  - 统一的 `Layout` 布局（头部导航、底部导航、LoadingBar）。
  - 每页通过 `PageHead` / `PostHead` 单独设置 `title` / `description` / `noindex`。
  - 所有外链统一增加 `target="_blank"` 与安全相关的 `rel` 属性。

- **辅助脚本与集成**
  - 预留 Obsidian → 博客内容导入能力（需要结合 `example.env` 与脚本自行扩展）。
  - 预留 dev.to 与 Medium 发布脚本（待完善）。

---

## 📦 环境要求

- **Node.js**：推荐 `>= 20`。
- **包管理器**：
  - 优先推荐 **pnpm**（仓库包含 `pnpm-lock.yaml`）。
  - 也可以使用 `npm` 或 `yarn`（需要自行保证依赖版本与 Node 版本兼容）。

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-name/Astro-Theme-Shyne.git
cd Astro-Theme-Shyne
```

（也可以直接从本仓库 Fork，然后在自己的仓库中修改。）

### 2. 安装依赖

- **使用 pnpm（推荐）**：

```bash
pnpm install
```

- **使用 npm**：

```bash
npm install
```

### 3. 本地开发

```bash
pnpm dev
```

默认运行地址：`http://localhost:1234`  
（端口等配置见 `astro.config.ts` 中 `server.port` / `server.host`。）

### 4. 生产构建与本地预览

```bash
# 构建（会先运行 astro check 做基础检查）
pnpm build

# 本地预览 dist 产物
pnpm preview
```

构建输出目录为 `dist`，可直接用于部署到静态托管平台。

---

## ⚙️ 核心配置说明

### 1. 站点基础配置：`src/config.ts`

- **`SITE: Site`**
  - `title`：站点名称。
  - `description`：站点描述（用于 SEO 与 RSS）。
  - `href`：站点线上地址（通常和 `astro.config.ts` 里的 `site` 一致）。
  - `author`：作者名称。
  - `footer.items`：页脚中显示的文字 / 链接组合。
  - `locale`：站点语言，例如 `en-US`。
  - `featuredExperienceCount`：首页展示的经历条数。
  - `featuredPostCount`：首页展示的文章数量。
  - `featuredProjectCount`：首页展示的项目数量（配合项目 `featured` 字段）。
  - `postsPerPage`：博客列表分页，每页文章数。
  - `projectsPerPage`：项目列表分页，每页项目数。

- **`FAVICON: Favicon`**
  - `src`：主 favicon 文件路径（相对于 `public`，例如 `/favicon/logo.png`）。
  - `appleTouchIcon`：Apple Touch Icon 路径。
  - `appTitle`：PWA / 应用标题。

- **`HEADER_LINKS: NavLink[]`**
  - 定义头部导航栏（`Header`）的链接。
  - 每个 `NavLink`：
    - `label`：显示文本（可为空，仅显示图标）。
    - `href`：跳转路径（如 `/blog`）。
    - `icon`：可选图标名称（如 `lucide:search`）。
    - `hideBelowPx`：可选，小屏幕下隐藏的断点。

- **`FOOTER_LINKS: NavLink[]`**
  - 页脚导航，通常放「About / Experience / Tags」等链接。

- **`SOCIAL_LINKS: SocialLink[]`**
  - 社交媒体链接配置，展示在首页 / About 等位置。
  - 字段：
    - `label`：平台名称（如 `GitHub`）。
    - `href`：链接（如 `https://github.com/your-name`）。
    - `icon`：图标名称（Lucide / Simple Icons）。

> 修改上述配置后，重新运行 `pnpm dev` 即可在本地看到效果。

### 2. Astro 与 Markdown 配置：`astro.config.ts`

- **`site`**
  - 站点基础 URL，例如 `https://your-domain.com`。
  - 用于生成 sitemap、RSS、canonical 链接等。

- **`integrations`**
  - `react()`：启用 React 支持。
  - `sitemap()`：自动生成 `sitemap-index.xml` 和相关子 sitemap。
  - `icon()`：支持 `astro-icon` 组件。

- **`vite.plugins`**
  - `tailwindcss()`：启用 Tailwind CSS 4。

- **`server`**
  - `port`：开发服务器端口（默认 1234）。
  - `host`：设置为 `true` 时可通过局域网访问。

- **`markdown`**
  - `remarkPlugins`：
    - `remarkMath`：数学公式。
    - `remarkEmoji`：Emoji。
    - `remarkGithubAdmonitionsToDirectives` + `remarkDirective` + 自定义 `parseDirectiveNode`：
      - 支持 GitHub 风格 Admonitions，如：
        - `> [!NOTE]`
        - `> [!IMPORTANT]` 等。
  - `rehypePlugins`：
    - `rehypeExternalLinks`：为外链统一设置 `target` / `rel`。
    - `rehypeHeadingIds`：为标题生成锚点 id。
    - `rehypeKatex`：公式渲染。
    - `rehypeComponents` + 自定义 `AdmonitionComponent`：将指令节点渲染为提示块。
    - `rehypeExpressiveCode` + `pluginCollapsibleSections` + `pluginLineNumbers`：
      - 代码块行号、折叠、暗色 / 亮色主题联动。
    - `rehypeShiki`：
      - 使用 Shiki 高亮代码，支持根据主题切换不同配色。

---

## 📝 内容写作与目录结构

所有内容都放在 `src/content` 目录，并通过 `src/content.config.ts` 定义集合与字段。

### 1. 博客文章：`src/content/blog`

- **目录结构建议**
  - 一个「父文章」一个文件夹，主文件命名为 `index.md`：
    - 示例：`src/content/blog/first-blog/index.md`
  - 当文章有多个子章节（Subposts）时：
    - 在同一文件夹下再建子目录，例如：
      - `src/content/blog/my-long-post/index.md`（父文章）
      - `src/content/blog/my-long-post/part-1/index.md`
      - `src/content/blog/my-long-post/part-2/index.md`
    - URL 形式：
      - 父文章：`/blog/my-long-post`
      - 子文章：`/blog/my-long-post/part-1`

- **frontmatter 字段（见 `content.config.ts`）**

```yaml
---
title: 我的第一篇博客        # 标题，可选（建议填写）
description: 这是一篇关于 Astro 的文章  # 简要描述，可选
date: 2026-01-01           # 发表日期，可选（用于排序与时间显示）
tags:                      # 标签数组，可选
  - astro
  - blog
order: 1                   # 可选，用于子文章排序的辅助字段
draft: false               # 是否为草稿，true 时不会出现在列表 / RSS 中
---
```

- **列表与排序规则（由 `data-utils.ts` 实现）**
  - `getAllPosts`：
    - 过滤掉 `draft: true` 的文章。
    - 不包含子文章（仅父级文章出现在列表中）。
    - 按 `date` 倒序排序（最近的在前）。
  - `getAllPostsAndSubposts`：
    - 同时包含父文章和子文章。
    - 用于生成静态路径、目录等。
  - `groupPostsByYear`：
    - 按年份（`date.getFullYear()`）分组。

- **标签相关**
  - `getAllTags`：统计所有非草稿文章中的标签数量。
  - `getSortedTags`：按计数降序 + 标签字母顺序排序，用于侧边栏标签云。
  - `getPostsByTag(tag)`：获取包含指定标签的全部文章。

- **阅读时间与目录**
  - `getPostReadingTime(postId)`：
    - 基于渲染后的 HTML，计算当前文章字数并估算阅读时间。
  - `getCombinedReadingTime(postId)`：
    - 如果文章有子文章，则叠加父文章与所有子文章字数，给出总阅读时间。
  - `getTOCSections(postId)`：
    - 将父文章和对应子文章的 Headings 整理成「目录段落」结构，配合 `TOCHeader` / `TOCSidebar` 使用。

### 2. 项目 / 作品：`src/content/projects`

- **基础结构**
  - 每个项目一个 Markdown 文件，如：
    - `src/content/projects/projects-1.md`

- **frontmatter 字段**

```yaml
---
name: 项目名称                 # 项目名
description: 项目简介           # 可选描述
startDate: 2025-01-01          # 开始时间，可选
endDate: 2025-06-01            # 结束时间，可选，留空表示进行中
sourceCodeLink: https://github.com/your-name/your-project  # 可选源码地址
siteLink: https://your-project.com                         # 可选演示地址
relatedBlogsLink: /blog/some-related-post                  # 可选相关博客链接
tags:                        # 标签（技术栈 / 类型等）
  - astro
  - tailwind
featured: true               # 是否在首页「Works」区域中展示
order: 1                     # 可选，控制精选区域中的显示顺序（数字越小越靠前）
---
```

- **排序与展示规则**
  - `getAllProjects`：
    - 首先按 `endDate` 倒序（未填写 `endDate` 的视为进行中，排在最前）。
    - 然后按 `startDate` 倒序。
    - 再按 `order` 从小到大。
  - `getFeaturedProjects(count)`：
    - 筛选 `featured: true` 的项目。
    - 优先按 `order` 再按 `startDate` 排序。
    - 返回指定数量，用于首页展示。
  - `groupProjectsByYear`：
    - 按 `startDate` 年份分组，`startDate` 为空则归为 `Unknown`。

### 3. 经历 / 时间线：`src/content/experience`

- **用途**
  - 描述学习 / 工作 / 实习 / 个人大事的时间线。
  - 在首页的「Experience」区域展示最近若干条，在 `/experience` 页面展示全部。

- **frontmatter 字段**

```yaml
---
role: 前端开发工程师                     # 职位 / 身份
company: 某某公司                        # 公司 / 机构名称
description: 负责 xxx 项目前端开发与性能优化   # 简要描述
startDate: 2024-01-01                   # 开始时间
endDate: 2024-12-31                     # 结束时间，可空表示至今
location: Shanghai, China               # 地点，可选
companyLogo: ./assets/logo.png          # 可选：使用 image() 管线导入的图片
companyUrl: https://company.com         # 公司官网，可选
tags:
  - frontend
  - astro
---
```

- **排序规则（`compareExperiences`）**
  - 正在进行中的经历（`endDate` 为空）永远排在最前。
  - 若都在进行中：按 `startDate` 新 → 旧。
  - 若都有结束时间：按 `endDate` 新 → 旧，再按 `startDate` 新 → 旧。

### 4. 照片时间线：`src/content/photos`

- **用途**
  - 在 `/photos` 页面，将某段时间内的多张照片以时间线 + 卡片形式展示，适合作为摄影 / 生活记录。

- **frontmatter 字段**

```yaml
---
title: 某次旅行                      # 事件标题
description: 一次难忘的旅行记录         # 可选描述
startDate: 2025-05-01                # 发生日期（用于排序与时间线）
endDate: 2025-05-07                  # 可选结束日期
iconType: emoji                      # 图标类型：emoji | icon | color | number | image
favicon: 🚀                          # 图标值：根据 iconType 含义不同（见下）
location: Tokyo, Japan              # 地点，可选

# 可选：直接在 frontmatter 中声明图片（推荐方式）
images:
  - src: ./assets/1.png
    alt: 第一张照片
  - src: ./assets/2.png
    alt: 第二张照片
---

正文中也可以写普通 Markdown 内容，并通过 `![](./assets/xxx.png)` 插入图片。
```

- **图标（时间线左侧圆点）的决定方式（见 `photos.ts`）**
  - 若手动指定 `iconType`：
    - `emoji`：`favicon` 视为 Emoji。
    - `icon`：可根据需要扩展（当前实现更偏向 emoji / color / image）。
    - `color`：`favicon` 为十六进制颜色值（如 `#ff0000`）。
    - `number`：`favicon` 为阿拉伯数字字符（如 `"1"`）。
    - `image`：`favicon` 为图片路径（支持前文的相对路径解析）。
  - 若 **未指定 `iconType`**：
    - 当 `favicon` 是颜色值 → 自动视为 `color`。
    - 当 `favicon` 为数字字符串 → 视为 `number`。
    - 当 `favicon` 能解析为有效图片路径或以 `/` 开头 → 视为 `image`。
    - 其他情况：默认视为 Emoji。

- **图片来源**
  - **优先使用 frontmatter 中的 `images`**：
    - 通过 Astro 的 `image()` 管线导入，具有宽高信息。
  - 若 `images` 为空：
    - 从 Markdown 正文中解析所有 `![]()` 图片，自动构建图片列表。
  - 图片实际文件放在对应条目的 `assets` 目录下，例如：
    - `src/content/photos/sample-1/sample-1.md`
    - `src/content/photos/sample-1/assets/1.png`

- **排序规则**
  - 在 `getPhotosTimeline` 中：
    - 优先按 `endDate`（或 `startDate`）倒序。
    - 没有时间信息的条目排在后面。

---

## 🔍 搜索、标签与导航

### 1. 搜索页 `/search`

- 数据来源：
  - 所有非草稿博客文章（`getAllPosts`）。
  - 所有项目（`getAllProjects`）。
  - 统一整理为 `allSearchData` 数组，包含：
    - `id` / `title` / `description` / `tags` / `slug` / `type` 等字段。
- 前端行为：
  - 文本框输入时即时过滤，无需网络请求。
  - 匹配规则：
    - 标题、描述、标签中包含关键字（大小写不敏感）。
  - 高亮：
    - 使用 `<mark>` 包裹匹配片段，方便视觉扫描。
  - URL 同步：
    - 搜索关键字会同步到 `?q=` 查询参数，支持刷新 / 分享搜索结果。

### 2. 标签系统

- `Tags` 页：
  - 展示所有标签及其文章数量。
- `Tags/[tag]` 页：
  - 展示具有该标签的所有文章。
- 标签来源：
  - 文章 frontmatter 中的 `tags` 字段。
  - 草稿文章（`draft: true`）的标签不会出现在标签云中。

### 3. 导航与面包屑

- 顶部导航由 `HEADER_LINKS` 驱动，所有页面通过 `Layout` 统一挂载。
- `Breadcrumbs` 组件：
  - 在大多数页面中用于显示当前位置和返回上级路径。
  - 结合 Lucide 图标（如 `lucide:tags` / `lucide:briefcase` / `lucide:library-big` 等）。

---

## 📚 博客阅读体验增强

- **阅读进度环**
  - 在博客详情页右下角显示。
  - 根据当前滚动位置相对于文章区域计算百分比。
  - 长时间停止滚动后，会从「百分比」切换为「回到顶部箭头」动画。
  - 点击或键盘（Enter / Space）可平滑回滚到页面顶部。

- **目录（Table of Contents）**
  - 对当前文章（以及子文章）进行标题提取，生成多段目录：
    - 父文章的「Overview」部分。
    - 各子文章的标题与小节。
  - 顶部 `TOCHeader` 与侧边栏 `TOCSidebar` 联动，方便长文阅读。

- **子文章导航**
  - 支持父文章与子文章之间的「上一篇 / 下一篇」导航。
  - 子文章页面会显示「父文章」在面包屑与导航中，方便读者返回。

---

## 🧩 样式与 UI 组件

- **全局样式**
  - `src/styles/global.css`：主要布局、基础变量。
  - `src/styles/typography.css`：排版与 `.prose` 样式。
  - `src/styles/misc.css`：杂项效果（背景网格、动画等）。

- **布局**
  - `Layout.astro`：包裹所有页面，提供头部、页脚与 LoadingBar。
  - `Header.astro`：站点顶部导航栏 + 主题切换。
  - `Footer.astro`：底部信息与导航。

- **基础组件（`src/components/base`）**
  - `Breadcrumbs`：面包屑导航。
  - `ExperienceTimeline`：时间线组件，复用在首页与 `/experience`。
  - `SocialIcons`：社交链接图标列表。
  - `AnimatedButton`、`Link` 等。

- **博客组件（`src/components/posts`）**
  - `PageHead` / `PostHead`：管理文章 / 页面 `<head>` 信息。
  - `BlogCard`：列表卡片样式。
  - `PostNavigation`、`SubpostsHeader` / `SubpostsSidebar`。
  - `TOCHeader` / `TOCSidebar`：文章目录。

- **项目组件**
  - `ProjectCard`：项目展示卡片（名称、时间、标签、链接等）。

- **照片组件**
  - `PhotoTimeline`：时间线布局。
  - `PolaroidStack` / `PolaroidCard` / `PhotoGalleryModal`：照片卡片与点击放大。

- **UI 组件（React / shadcn 风格）**
  - `button.tsx`、`badge.tsx`、`pagination.tsx`、`scroll-area.tsx` 等。
  - 使用 `class-variance-authority` + `tailwind-merge` 组织变体与类名。

---

## 🔧 常用命令

所有命令均在项目根目录执行：

| 命令                              | 说明                                                         |
| :-------------------------------- | :----------------------------------------------------------- |
| `pnpm dev`                        | 启动本地开发服务器                                           |
| `pnpm build`                      | 运行 `astro check` 并构建生产版本                            |
| `pnpm preview`                    | 启动本地服务器预览构建后的站点                               |
| `pnpm astro ...`                  | 直接调用 Astro CLI（如 `pnpm astro add react` 等）          |
| `pnpm prettier`                   | 使用 Prettier 格式化 `ts/tsx/css/astro` 文件                 |
| `pnpm import:obsidian`            | 预留：从 Obsidian 笔记中导入 Markdown（需结合脚本自行实现） |
| `pnpm import-and-commit:obsidian` | 预留：导入 Obsidian 并自动提交（需结合脚本自行实现）         |
| `pnpm publish:devto`              | 预留：将文章发布到 dev.to                                   |
| `pnpm publish:medium`             | 预留：将文章发布到 Medium                                   |

> Obsidian 与发布相关脚本需要先复制 `example.env` 为 `.env`，并根据自身环境配置路径、Token 等变量；脚本逻辑可参考 `scripts` 目录并按需扩展。

---

## 📦 部署指南

本项目构建产物为纯静态文件，可部署到任意静态托管平台，例如：

- **Vercel**
- **Netlify**
- **GitHub Pages**
- **Cloudflare Pages**

以 **Vercel** 为例：

1. 在 GitHub 创建仓库并推送代码。
2. 在 Vercel 新建项目，选择该仓库。
3. 构建命令设置为：`pnpm build`。
4. 输出目录设置为：`dist`。
5. 如需自定义域名 / 环境变量，在 Vercel 面板中进一步配置。

部署后请确保：

- `astro.config.ts` 中的 `site` 与真实线上地址一致（否则 sitemap / RSS 链接会不正确）。
- 若使用 RSS / robots.txt，应确认路由 `/rss.xml` 与 `/robots.txt` 可正常访问。

---

## 📌 二次开发与扩展建议

- **站点个性化**
  - 更换 `public/favicon` 下的图标和 `public/hero` / `public/images` 中的图片。
  - 修改首页 / About 页中的文案与图片。
  - 调整 `SITE` / `HEADER_LINKS` / `FOOTER_LINKS` / `SOCIAL_LINKS`。

- **内容扩展**
  - 按照现有 schema，在对应集合目录中新增 Markdown 文件即可：
    - 新文章：`src/content/blog/...`
    - 新项目：`src/content/projects/...`
    - 新经历：`src/content/experience/...`
    - 新照片集：`src/content/photos/...`

- **功能扩展方向**
  - 为搜索增加「按类型过滤」（仅文章 / 仅项目）。
  - 增加分类页 / 归档页（可基于现有分组工具函数扩展）。
  - 增强主题切换（多套配色方案）与动画效果。
  - 补全 Obsidian / dev.to / Medium 发布脚本。

欢迎在此基础上自由二次开发，改造成适合自己风格的个人站点主题。欢迎 Issue / PR 反馈与改进建议。

