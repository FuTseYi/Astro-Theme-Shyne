import type {
  Site,
  Favicon,
  NavLink,
  SocialLink,
} from '@/types'

export const SITE: Site = {
  title: 'Astro-Theme-Shyne',
  description:
    'astro-theme-Shyne is a opinionated, unstyled blogging template—built with Astro, Tailwind, and shadcn/ui.',
  href: 'https://astro-theme-shyne.vercel.app',
  author: 'FuTseYi',
  locale: 'en-US',
  featuredPostCount: 2,
  featuredProjectCount: 3,
  postsPerPage: 3,
  projectsPerPage: 3,
}

export const FAVICON: Favicon = {
  src: '/favicon/logo.png',
  appleTouchIcon: '/favicon/logo.png',
  appTitle: 'Astro-Theme-Shyne',
}

export const HEADER_LINKS: NavLink[] = [
  {
    label: 'blog',
    href: '/blog',
  },
  {
    label: 'projects',
    href: '/projects',
  },
  {
    label: '',
    href: '/search',
    icon: 'lucide:search',
  },
]

export const FOOTER_LINKS: NavLink[] = [
  {
    label: 'About',
    href: '/about',
    icon: 'lucide:user-star',
  },
  {
    label: 'Tags',
    href: '/tags',
    icon: 'lucide:tags',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Email',
    href: 'mailto:',
    icon: 'lucide:send',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/',
    icon: 'simple-icons:linkedin',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/',
    icon: 'simple-icons:github',
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com/',
    icon: 'simple-icons:x',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/',
    icon: 'lucide:instagram',
  },
  {
    label: 'RSS',
    href: '/rss.xml',
    icon: 'lucide:rss',
  }
]


