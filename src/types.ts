export type Site = {
  title: string
  description: string
  href: string
  author: string
  locale: string
  featuredPostCount: number
  featuredProjectCount: number
  postsPerPage: number
  projectsPerPage: number
  defaultPostBanner: string
  defaultProjectBanner: string
}

export type SocialLink = {
  href: string
  label: string
  icon?: string
  hideBelowPx?: number
}

export type IconMap = {
  [key: string]: string | { icon: string; color: string }
}

export type Favicon = {
  png: string
  appleTouchIcon: string
  appTitle: string
  manifest: string
}