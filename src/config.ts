import type {
  Site,
  Favicon,
  NavLink,
  SocialLink,
} from '@/types'

export const SITE: Site = {
  title: "Shyne",
  description:
    "A minimalist personal blog and portfolio built with Astro, featuring a unique Polaroid-style photo gallery timeline.",
  href: "https://shyne.xieyi.org",
  author: "FuTseYi",
  footer: {
    items: [
      { type: "text", value: "Crafted with " },
      { type: "link", label: "Shyne", href: "/about" },
      { type: "text", value: " & " },
      { type: "link", label: "Astro-Theme-Shyne", href: "https://github.com/FuTseYi/Astro-Theme-Shyne" },
    ],
  },
  locale: "en-US",
  featuredExperienceCount: 2,
  featuredPostCount: 3,
  featuredProjectCount: 3,
  postsPerPage: 6,
  projectsPerPage: 3,
}

// Use https://realfavicongenerator.net/ to generate favicons
export const FAVICON: Favicon = {
  svg: "/favicon/favicon.svg",
  png96: "/favicon/favicon-96x96.png",
  ico: "/favicon/favicon.ico",
  appleTouchIcon: "/favicon/apple-touch-icon.png",
}

export const HEADER_LINKS: NavLink[] = [
  {
    label: "Blog",
    href: "/blog",
  },
  {
    label: "Projects",
    href: "/projects",
  },
  {
    label: "Photos",
    href: "/photos",
  },
  {
    label: "",
    href: "/search",
    icon: "lucide:search",
  },
]

export const FOOTER_LINKS: NavLink[] = [
  {
    label: "About",
    href: "/about",
    icon: "lucide:user-star",
  },
  {
    label: "Experience",
    href: "/experience",
    icon: "lucide:briefcase-business",
  },
  {
    label: "Tags",
    href: "/tags",
    icon: "lucide:tags",
  },
]

// Social media links - customize with your own profiles
export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Email",
    href: "mailto:your.email@example.com",
    icon: "lucide:mail",
  },
  {
    label: "GitHub",
    href: "https://github.com/FuTseYi",
    icon: "simple-icons:github",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/yourusername",
    icon: "simple-icons:linkedin",
  },
  {
    label: "Twitter",
    href: "https://twitter.com/yourusername",
    icon: "simple-icons:x",
  },
  {
    label: "Instagram",
    href: "https://instagram.com/yourusername",
    icon: "lucide:instagram",
  },
  {
    label: "RSS",
    href: "/rss.xml",
    icon: "lucide:rss",
  },
]
