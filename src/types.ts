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
}

export type NavLink = {
  href: string
  label: string
  icon?: string
  hideBelowPx?: number
}

export type SocialLink = {
  href: string
  label: string
  icon?: string
  hideBelowPx?: number
}

export type Favicon = {
  src: string
  appleTouchIcon: string
  appTitle: string
}