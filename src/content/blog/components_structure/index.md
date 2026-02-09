---
title: COMPONENTS_STRUCTURE
description: COMPONENTS_STRUCTURE
date: '2026-02-04'
tags:
  - test
  - markdown
order: 
draft: false
---

# 组件结构说明

本项目的组件已按功能进行分类整理

## 📁 组件目录结构

```
src/components/
├── base/                      # 基础通用组件
│   ├── AnimatedButton.astro   # 动画按钮
│   ├── BannerImage.astro      # 横幅图片
│   ├── Breadcrumbs.astro      # 面包屑导航
│   ├── ExperienceTimeline.astro # 经历时间线
│   ├── Favicons.astro         # 网站图标
│   ├── Footer.astro           # 页脚
│   ├── Head.astro             # 头部元数据
│   ├── Header.astro           # 页眉导航
│   ├── Link.astro             # 链接组件
│   ├── LoadingBar.astro       # 加载条
│   ├── SocialIcons.astro      # 社交图标
│   └── ThemeToggle.astro      # 主题切换
│
├── posts/                     # 文章相关组件
│   ├── base/                  # 文章基础组件
│   │   ├── PageHead.astro     # 页面头部
│   │   ├── PostHead.astro     # 文章头部
│   │   ├── PostNavigation.astro # 文章导航
│   │   ├── SubpostsHeader.astro # 子文章头部
│   │   └── SubpostsSidebar.astro # 子文章侧边栏
│   ├── card/                  # 文章卡片组件
│   │   └── BlogCard.astro     # 博客卡片
│   └── toc/                   # 目录相关组件
│       ├── TOCHeader.astro    # 目录头部
│       └── TOCSidebar.astro   # 目录侧边栏
│
├── projects/                  # 项目相关组件
│   └── ProjectCard.astro      # 项目卡片
│
└── ui/                        # UI 库组件 (shadcn/ui)
    ├── avatar.tsx
    ├── badge.tsx
    ├── breadcrumb.tsx
    ├── button.tsx
    ├── input.tsx
    ├── pagination.tsx
    ├── scroll-area.tsx
    └── separator.tsx
```

## 🎯 组件分类说明

### base/ - 基础组件
存放项目中最基础、最通用的组件，这些组件可以在整个应用的任何地方使用：
- 布局相关：`Header`、`Footer`、`Head`
- 导航相关：`Breadcrumbs`、`Link`
- 交互相关：`AnimatedButton`、`ThemeToggle`、`LoadingBar`
- 展示相关：`BannerImage`、`SocialIcons`、`ExperienceTimeline`

### posts/ - 文章相关组件
专门用于博客文章功能的组件，按子功能进一步分类：

#### posts/base/ - 文章基础组件
文章页面的核心组件：
- `PostHead.astro` - 文章详情页头部
- `PageHead.astro` - 通用页面头部
- `PostNavigation.astro` - 文章上下导航
- `SubpostsHeader.astro` / `SubpostsSidebar.astro` - 子文章相关

#### posts/card/ - 文章卡片
用于文章列表展示的卡片组件：
- `BlogCard.astro` - 博客卡片组件

#### posts/toc/ - 目录组件
文章目录相关功能：
- `TOCHeader.astro` - 目录头部
- `TOCSidebar.astro` - 目录侧边栏

### projects/ - 项目组件
项目展示相关的组件：
- `ProjectCard.astro` - 项目卡片展示

### ui/ - UI 组件库
基于 shadcn/ui 的 React 组件，提供一致的 UI 交互体验。

## 📝 导入路径示例

### 导入基础组件
```astro
import Header from '@/components/base/Header.astro'
import Footer from '@/components/base/Footer.astro'
import Link from '@/components/base/Link.astro'
```

### 导入文章组件
```astro
import BlogCard from '@/components/posts/card/BlogCard.astro'
import PostHead from '@/components/posts/base/PostHead.astro'
import TOCSidebar from '@/components/posts/toc/TOCSidebar.astro'
```

### 导入项目组件
```astro
import ProjectCard from '@/components/projects/ProjectCard.astro'
```

### 导入 UI 组件
```astro
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
```

## 🔄 迁移说明

原有的扁平化组件结构已迁移为分类结构：

| 旧路径                           | 新路径                                    |
| -------------------------------- | ----------------------------------------- |
| `@/components/Header.astro`      | `@/components/base/Header.astro`          |
| `@/components/Footer.astro`      | `@/components/base/Footer.astro`          |
| `@/components/BlogCard.astro`    | `@/components/posts/card/BlogCard.astro`  |
| `@/components/PostHead.astro`    | `@/components/posts/base/PostHead.astro`  |
| `@/components/TOCHeader.astro`   | `@/components/posts/toc/TOCHeader.astro`  |
| `@/components/ProjectCard.astro` | `@/components/projects/ProjectCard.astro` |

所有引用已自动更新，无需手动修改。

## ✨ 优势

1. **清晰的结构** - 组件按功能分类，易于查找和维护
2. **更好的扩展性** - 新增组件时有明确的归属位置
3. **提升协作效率** - 团队成员能快速理解组件职责
4. **符合最佳实践** - 遵循现代前端项目的组织规范

