---
title: Welcome to Astro Theme Shyne
description: Get started with Astro Theme Shyne - a powerful blog and portfolio theme with Polaroid photo gallery
date: 2026-03-16
tags:
  - astro
  - tutorial
  - getting-started
draft: false
---

Welcome to **Astro Theme Shyne**! This guide will help you understand the key features and how to customize this theme for your personal blog or portfolio.

## Why Astro Theme Shyne?

Astro Theme Shyne is built with modern technologies to provide:

- Blazing fast performance with static site generation
- Beautiful Polaroid-style photo gallery
- Full TypeScript support
- SEO optimization out of the box

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/FuTseYi/Astro-Theme-Shyne.git
cd Astro-Theme-Shyne
pnpm install
pnpm dev
```

### Configuration

Edit `src/config.ts` to customize your site:

```typescript
export const SITE: Site = {
  title: 'Your Site Name',
  description: 'Your site description',
  href: 'https://your-domain.com',
  author: 'Your Name',
}
```

## Key Features

### Polaroid Photo Gallery

One of the unique features is the Polaroid-style photo timeline. Here's how to use it:

1. Create a new folder in `src/content/photos/`
2. Add your photos to an `assets` subfolder
3. Create an `index.md` file with frontmatter

```markdown
---
title: My Trip
description: An amazing journey
startDate: 2026-01-01
favicon: ✈️
location: Japan
---

![](./assets/photo1.jpg)
![](./assets/photo2.jpg)
```

### Blog Posts

Create blog posts in `src/content/blog/`:

```markdown
---
title: My First Post
date: 2026-01-01
tags:
  - tech
---

Your content here...
```

### Projects

Add projects in `src/content/projects/`:

```markdown
---
name: My Project
description: A cool project
startDate: 2026-01-01
tags:
  - react
featured: true
---
```

## Advanced Features

### Subposts

For long-form content, you can organize posts into subposts:

```
src/content/blog/my-topic/
  index.md      (parent post)
  part-1/
    index.md    (subpost 1)
  part-2/
    index.md    (subpost 2)
```

### Custom Components

The theme includes React components in `src/components/ui/` following shadcn/ui patterns.

## Deployment

Deploy to Vercel, Netlify, or any static hosting:

```bash
pnpm build
```

The output will be in the `dist` folder.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](https://github.com/FuTseYi/Astro-Theme-Shyne/blob/main/CONTRIBUTING.md).

## License

MIT License - feel free to use this theme for your own projects!

---

Happy blogging!
