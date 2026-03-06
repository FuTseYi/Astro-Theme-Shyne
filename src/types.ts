export type Site = {
  title: string
  description: string
  href: string
  author: string
  footer: {
    items: (
      | {
        type: 'text'
        value: string
      }
      | {
        type: 'link'
        label: string
        href: string
      }
    )[]
  }
  locale: string
  featuredPostCount: number
  featuredProjectCount: number
  featuredExperienceCount: number
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
  svg: string
  png96: string
  ico: string
  appleTouchIcon: string
}