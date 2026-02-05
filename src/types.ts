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

export type ManifestIcon = {
  src: string
  sizes?: string
  type?: string
  purpose?: string
}

export type Favicon = {
  png: string
  appleTouchIcon: string
  appTitle: string
  themeColor?: string
  backgroundColor?: string
  manifestIcons?: ManifestIcon[]
}