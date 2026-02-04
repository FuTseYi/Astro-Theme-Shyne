import type {
  Favicon,
  IconMap,
  Site,
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
  defaultPostBanner: '/default/default-post-banner-1200x630.jpg',
  defaultProjectBanner: '/default/default-project-banner-1200x630.jpg'
}

export const FAVICON: Favicon = {
  png: '/favicon/logo.png',
  appleTouchIcon: '/favicon/logo.png',
  appTitle: 'Astro-Theme-Shyne',
  manifest: '/site.webmanifest'
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/search',
    label: '',
    icon: 'lucide:search',
  },
  {
    href: '/about',
    label: 'about',
  },
  {
    href: '/blog',
    label: 'blog',
  },
  {
    href: '/projects',
    label: 'projects',
  },
  /*{
    href: '/tags',
    label: 'tags',
  },*/
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'mailto:',
    label: 'Email',
  },
  {
    href: 'https://linkedin.com/in/',
    label: 'LinkedIn',
  },
  {
    href: 'https://github.com/',
    label: 'GitHub',
  },
  {
    href: 'https://twitter.com/',
    label: 'Twitter',
  },
  {
    href: 'https://instagram.com/',
    label: 'Instagram',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  }
]

export const ICON_MAP: IconMap = {
  // socials
  Website: 'lucide:globe',
  GitHub: 'simple-icons:github',
  LinkedIn: 'simple-icons:linkedin',
  Twitter: 'simple-icons:x',
  Instagram: 'lucide:instagram',
  Email: 'lucide:send',
  RSS: 'lucide:rss',

  // tech
  typescript: { icon: 'simple-icons:typescript', color: '#3178C6' },
  nodejs: { icon: 'simple-icons:nodedotjs', color: '#5FA04E' },
  npm: { icon: 'simple-icons:npm', color: '#CB3837' },
  javascript: { icon: 'simple-icons:javascript', color: '#F7DF1E' },
  html: { icon: 'simple-icons:html5', color: '#E34F26' },
  css: { icon: 'simple-icons:css3', color: '#1572B6' },
  react: { icon: 'simple-icons:react', color: '#61DAFB' },
  vue: { icon: 'simple-icons:vuedotjs', color: '#4FC08D' },
  angular: { icon: 'simple-icons:angular', color: '#DD0031' },
  svelte: { icon: 'simple-icons:svelte', color: '#FF3E00' },
  nextdotjs: { icon: 'simple-icons:nextdotjs', color: '#888888' },
  astro: { icon: 'simple-icons:astro', color: '#FF5D01' },
  remix: { icon: 'simple-icons:remix', color: '#121212' },
  nuxt: { icon: 'simple-icons:nuxt', color: '#00DC82' },
  express: { icon: 'simple-icons:express', color: '#888888' },
  mongodb: { icon: 'simple-icons:mongodb', color: '#47A248' },
  mysql: { icon: 'simple-icons:mysql', color: '#4479A1' },
  postgresql: { icon: 'simple-icons:postgresql', color: '#336791' },
  redis: { icon: 'simple-icons:redis', color: '#DC382D' },
  docker: { icon: 'simple-icons:docker', color: '#2496ED' },
  kubernetes: { icon: 'simple-icons:kubernetes', color: '#326CE5' },
  terraform: { icon: 'simple-icons:terraform', color: '#7B42BC' },
  git: { icon: 'simple-icons:git', color: '#F05032' },
  vercel: { icon: 'simple-icons:vercel', color: '#888888' },
  java: { icon: 'lucide:coffee', color: '#F8981D' },
  maven: { icon: 'simple-icons:apachemaven', color: '#C71A36' },
  'vscode extension api': { icon: 'lucide:code', color: '#007ACC' },
}

