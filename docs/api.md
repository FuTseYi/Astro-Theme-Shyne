# Astro Theme Shyne - API Reference

This document provides detailed API reference for developers extending or customizing the theme.

## Content Collections

### Blog Collection

**File Location**: `src/content/blog/`

**Frontmatter Schema**:

```typescript
interface BlogFrontmatter {
  title?: string;           // Post title
  description?: string;    // SEO description
  date?: Date;              // Publication date
  tags?: string[];          // Array of tags
  order?: number;           // Sort order for subposts
  draft?: boolean;          // Draft flag (excludes from lists)
}
```

**Directory Structure**:
```
blog/
├── my-post/
│   ├── index.md           // Parent post
│   ├── part-1/
│   │   └── index.md       // Subpost 1
│   └── part-2/
│       └── index.md       // Subpost 2
```

### Projects Collection

**File Location**: `src/content/projects/`

**Frontmatter Schema**:

```typescript
interface ProjectFrontmatter {
  name: string;                    // Project name
  description?: string;            // Project description
  startDate?: Date;                // Start date
  endDate?: Date | null;           // End date (null = ongoing)
  sourceCodeLink?: string;         // GitHub URL
  siteLink?: string;               // Live demo URL
  relatedBlogsLink?: string;       // Related blog post
  tags?: string[];                 // Tech stack tags
  featured?: boolean;              // Show on homepage
  order?: number;                  // Sort order
  companyLogo?: ImageMetadata;     // Company logo
  companyUrl?: string;             // Company website
}
```

### Experience Collection

**File Location**: `src/content/experience/`

**Frontmatter Schema**:

```typescript
interface ExperienceFrontmatter {
  role: string;                    // Job title
  company: string;                 // Company name
  description?: string;           // Brief description
  startDate: Date;                // Start date
  endDate?: Date | null;          // End date (null = current)
  location?: string;              // Job location
  companyLogo?: ImageMetadata;    // Company logo
  companyUrl?: string;            // Company website
  tags?: string[];                // Skill tags
}
```

### Photos Collection (Polaroid Gallery)

**File Location**: `src/content/photos/`

**Frontmatter Schema**:

```typescript
interface PhotoFrontmatter {
  title: string;                  // Event title
  description?: string;           // Event description
  startDate?: Date;               // Event start date
  endDate?: Date;                 // Event end date
  iconType?: 'emoji' | 'icon' | 'color' | 'number' | 'image';
  favicon?: string;               // Icon value (emoji, hex color, number, or image path)
  location?: string;              // Location
  images?: Array<{               // Optional: frontmatter images
    src: ImageMetadata;
    alt?: string;
  }>;
}
```

## Utility Functions

### Blog Data

```typescript
// Get all published posts (excludes drafts and subposts)
getAllPosts(): Promise<BlogCollectionEntry[]>

// Get all posts including subposts
getAllPostsAndSubposts(): Promise<BlogCollectionEntry[]>

// Group posts by year
groupPostsByYear(posts: BlogCollectionEntry[]): Map<number, BlogCollectionEntry[]>

// Get posts by tag
getPostsByTag(tag: string): Promise<BlogCollectionEntry[]>

// Get reading time for a post
getPostReadingTime(postId: string): number // in minutes

// Get combined reading time (parent + subposts)
getCombinedReadingTime(postId: string): number

// Get table of contents sections
getTOCSections(postId: string): TOCSection[]
```

### Project Data

```typescript
// Get all projects
getAllProjects(): Promise<ProjectCollectionEntry[]>

// Get featured projects
getFeaturedProjects(count: number): Promise<ProjectCollectionEntry[]>

// Group projects by year
groupProjectsByYear(projects: ProjectCollectionEntry[]): Map<string, ProjectCollectionEntry[]>
```

### Photo Timeline

```typescript
// Get all photos in timeline format
getPhotosTimeline(): Promise<PhotoData[]>
```

## Components

### Photo Components

| Component | Description |
|:----------|:------------|
| `PhotoTimeline` | Main timeline container |
| `PolaroidCard` | Individual photo card with Polaroid style |
| `PolaroidStack` | Stack multiple Polaroid cards |
| `PhotoGalleryModal` | Lightbox modal for full-size viewing |
| `TimelineIcon` | Timeline icon renderer |

### Blog Components

| Component | Description |
|:----------|:------------|
| `BlogCard` | Post list card |
| `TOCHeader` | Sticky table of contents header |
| `TOCSidebar` | Sidebar table of contents |
| `PostNavigation` | Previous/Next post navigation |
| `SubpostsHeader` | Subpost section header |
| `SubpostsSidebar` | Subpost navigation sidebar |

## Configuration

### Site Configuration

Edit `src/config.ts`:

```typescript
export const SITE: Site = {
  title: string,           // Site title
  description: string,     // SEO description
  href: string,            // Full URL
  author: string,         // Author name
  footer: FooterConfig,   // Footer items
  locale: string,         // e.g., 'en-US'
  featuredExperienceCount: number,
  featuredPostCount: number,
  featuredProjectCount: number,
  postsPerPage: number,
  projectsPerPage: number,
}
```

### Navigation Configuration

```typescript
export const HEADER_LINKS: NavLink[] = [
  {
    label: 'Link Label',
    href: '/path',
    icon?: 'lucide:icon-name',
    hideBelowPx?: 768,
  },
]
```

## Customization

### Adding New UI Components

Follow the shadcn/ui pattern:

```typescript
// src/components/ui/MyComponent.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

const myComponentVariants = cva(
  'base-styles-here',
  {
    variants: {
      variant: {
        default: 'default-styles',
        destructive: 'destructive-styles',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {}

export function MyComponent({ 
  className, 
  variant, 
  ...props 
}: MyComponentProps) {
  return (
    <div 
      className={twMerge(myComponentVariants({ variant }), className)}
      {...props}
    />
  )
}
```

### Custom Markdown Plugins

Add plugins in `astro.config.ts`:

```typescript
import remarkMyPlugin from 'remark-my-plugin'

export default defineConfig({
  markdown: {
    remarkPlugins: [
      remarkMyPlugin,
      // ... other plugins
    ],
  },
})
```

## Deployment

### Environment Variables

Create `.env`:

```bash
# Required for some features
SITE_URL=https://your-domain.com
```

### Build Commands

| Platform | Build Command | Output Directory |
|:---------|:--------------|:-----------------|
| Vercel | `pnpm build` | `dist` |
| Netlify | `pnpm build` | `dist` |
| Cloudflare Pages | `pnpm build` | `dist` |
| GitHub Pages | `pnpm build` | `dist` |

---

For more information, visit the [GitHub Repository](https://github.com/FuTseYi/Astro-Theme-Shyne).
