import { getCollection, render, type CollectionEntry } from 'astro:content'
import { readingTime, calculateWordCountFromHtml } from '@/lib/utils'

export function compareExperiences(
  a: CollectionEntry<'experience'>,
  b: CollectionEntry<'experience'>,
): number {
  const endA = a.data.endDate
  const endB = b.data.endDate

  const isOngoingA = !endA
  const isOngoingB = !endB

  // Case 1: both ongoing -> sort by startDate (new -> old)
  if (isOngoingA && isOngoingB) {
    const startA = a.data.startDate?.getTime() ?? 0
    const startB = b.data.startDate?.getTime() ?? 0
    if (startA !== startB) {
      return startB - startA
    }
    return a.id.localeCompare(b.id)
  }

  // Case 2: only one ongoing -> ongoing first
  if (isOngoingA !== isOngoingB) {
    return isOngoingA ? -1 : 1
  }

  // Case 3: both have endDate -> endDate (new -> old), then startDate
  const endTimeA = endA!.getTime()
  const endTimeB = endB!.getTime()
  if (endTimeA !== endTimeB) {
    return endTimeB - endTimeA
  }

  const startA = a.data.startDate?.getTime() ?? 0
  const startB = b.data.startDate?.getTime() ?? 0
  if (startA !== startB) {
    return startB - startA
  }

  return a.id.localeCompare(b.id)
}

export async function getAllPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog')
  return posts
    .filter((post) => !post.data.draft && !isSubpost(post.id))
    .sort((a, b) => {
      const dateA = a.data.date?.valueOf() ?? 0
      const dateB = b.data.date?.valueOf() ?? 0
      return dateB - dateA
    })
}

export async function getAllPostsAndSubposts(): Promise<
  CollectionEntry<'blog'>[]
> {
  const posts = await getCollection('blog')
  return posts
    .filter((post) => !post.data.draft)
    .sort((a, b) => {
      const dateA = a.data.date?.valueOf() ?? 0
      const dateB = b.data.date?.valueOf() ?? 0
      return dateB - dateA
    })
}

export async function getAllProjects(): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getCollection('projects')
  return projects.sort((a, b) => {
    // Primary: endDate (new -> old), treat "ongoing" (no endDate) as most recent
    const endA = a.data.endDate?.getTime()
    const endB = b.data.endDate?.getTime()
    const endTimeA = endA ?? Number.POSITIVE_INFINITY
    const endTimeB = endB ?? Number.POSITIVE_INFINITY
    const endDiff = endTimeB - endTimeA
    if (endDiff !== 0) return endDiff

    // Secondary: startDate (new -> old)
    const startA = a.data.startDate?.getTime() ?? 0
    const startB = b.data.startDate?.getTime() ?? 0
    const startDiff = startB - startA
    if (startDiff !== 0) return startDiff

    // Tertiary: order (low -> high)
    const orderA = a.data.order ?? Infinity
    const orderB = b.data.order ?? Infinity
    const orderDiff = orderA - orderB
    if (orderDiff !== 0) return orderDiff

    return a.id.localeCompare(b.id)
  })
}

export async function getRecentProjects(
  count: number,
): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getAllProjects()
  return projects.slice(0, count)
}

export async function getFeaturedProjects(
  count: number,
): Promise<
  CollectionEntry<'projects'>[]
> {
  const projects = await getAllProjects()
  const featuredProjects = projects
    .filter((project) => project.data.featured === true)
    .sort((a, b) => {
      // Sort by order first (lower numbers first), then by startDate
      const orderA = a.data.order ?? Infinity
      const orderB = b.data.order ?? Infinity
      if (orderA !== orderB) {
        return orderA - orderB
      }
      const dateA = a.data.startDate?.getTime() || 0
      const dateB = b.data.startDate?.getTime() || 0
      return dateB - dateA
    })
  return featuredProjects.slice(0, count)
}

export async function getProjectById(
  projectId: string,
): Promise<CollectionEntry<'projects'> | null> {
  const projects = await getAllProjects()
  return projects.find((project) => project.id === projectId) || null
}

export async function getAllExperiences(): Promise<
  CollectionEntry<'experience'>[]
> {
  const experiences = await getCollection('experience')
  return experiences.sort(compareExperiences)
}

export async function getRecentExperiences(
  count: number,
): Promise<CollectionEntry<'experience'>[]> {
  const experiences = await getAllExperiences()
  // `getAllExperiences()` already sorts experiences (ongoing first, then by date new -> old)
  return experiences.slice(0, count)
}

export function groupProjectsByYear(
  projects: CollectionEntry<'projects'>[],
): Record<string, CollectionEntry<'projects'>[]> {
  return projects.reduce(
    (acc: Record<string, CollectionEntry<'projects'>[]>, project) => {
      const year = project.data.startDate
        ? project.data.startDate.getFullYear().toString()
        : 'Unknown'
      ;(acc[year] ??= []).push(project)
      return acc
    },
    {},
  )
}

export async function getAllTags(): Promise<Map<string, number>> {
  const posts = await getAllPosts()
  return posts.reduce((acc, post) => {
    post.data.tags?.forEach((tag) => {
      acc.set(tag, (acc.get(tag) || 0) + 1)
    })
    return acc
  }, new Map<string, number>())
}

export async function getAdjacentPosts(currentId: string): Promise<{
  newer: CollectionEntry<'blog'> | null
  older: CollectionEntry<'blog'> | null
  parent: CollectionEntry<'blog'> | null
}> {
  const allPosts = await getAllPosts()

  if (isSubpost(currentId)) {
    const parentId = getParentId(currentId)
    const allPosts = await getAllPosts()
    const parent = allPosts.find((post) => post.id === parentId) || null

    const posts = await getCollection('blog')
    const subposts = posts
      .filter(
        (post) =>
          isSubpost(post.id) &&
          getParentId(post.id) === parentId &&
          !post.data.draft,
      )
      .sort((a, b) => {
        const dateA = a.data.date?.valueOf() ?? 0
        const dateB = b.data.date?.valueOf() ?? 0
        const dateDiff = dateA - dateB
        if (dateDiff !== 0) return dateDiff

        const orderA = a.data.order ?? 0
        const orderB = b.data.order ?? 0
        return orderA - orderB
      })

    const currentIndex = subposts.findIndex((post) => post.id === currentId)
    if (currentIndex === -1) {
      return { newer: null, older: null, parent }
    }

    return {
      newer:
        currentIndex < subposts.length - 1 ? subposts[currentIndex + 1] : null,
      older: currentIndex > 0 ? subposts[currentIndex - 1] : null,
      parent,
    }
  }

  const parentPosts = allPosts.filter((post) => !isSubpost(post.id))
  const currentIndex = parentPosts.findIndex((post) => post.id === currentId)

  if (currentIndex === -1) {
    return { newer: null, older: null, parent: null }
  }

  return {
    newer: currentIndex > 0 ? parentPosts[currentIndex - 1] : null,
    older:
      currentIndex < parentPosts.length - 1
        ? parentPosts[currentIndex + 1]
        : null,
    parent: null,
  }
}

export async function getPostsByTag(
  tag: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.filter((post) => post.data.tags?.includes(tag))
}

export async function getRecentPosts(
  count: number,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getAllPosts()
  return posts.slice(0, count)
}

export async function getSortedTags(): Promise<
  { tag: string; count: number }[]
> {
  const tagCounts = await getAllTags()
  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.tag.localeCompare(b.tag)
    })
}

export function getParentId(subpostId: string): string {
  return subpostId.split('/')[0]
}

export async function getSubpostsForParent(
  parentId: string,
): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog')
  return posts
    .filter(
      (post) =>
        !post.data.draft &&
        isSubpost(post.id) &&
        getParentId(post.id) === parentId,
    )
    .sort((a, b) => {
      const dateA = a.data.date?.valueOf() ?? 0
      const dateB = b.data.date?.valueOf() ?? 0
      const dateDiff = dateA - dateB
      if (dateDiff !== 0) return dateDiff

      const orderA = a.data.order ?? 0
      const orderB = b.data.order ?? 0
      return orderA - orderB
    })
}

export function groupPostsByYear(
  posts: CollectionEntry<'blog'>[],
): Record<string, CollectionEntry<'blog'>[]> {
  return posts.reduce(
    (acc: Record<string, CollectionEntry<'blog'>[]>, post) => {
      const year = post.data.date
        ? post.data.date.getFullYear().toString()
        : 'Unknown'
      ;(acc[year] ??= []).push(post)
      return acc
    },
    {},
  )
}

export async function hasSubposts(postId: string): Promise<boolean> {
  const subposts = await getSubpostsForParent(postId)
  return subposts.length > 0
}

export function isSubpost(postId: string): boolean {
  return postId.includes('/')
}

export async function getParentPost(
  subpostId: string,
): Promise<CollectionEntry<'blog'> | null> {
  if (!isSubpost(subpostId)) {
    return null
  }

  const parentId = getParentId(subpostId)
  const allPosts = await getAllPosts()
  return allPosts.find((post) => post.id === parentId) || null
}

export async function getPostById(
  postId: string,
): Promise<CollectionEntry<'blog'> | null> {
  const allPosts = await getAllPostsAndSubposts()
  return allPosts.find((post) => post.id === postId) || null
}

export async function getSubpostCount(parentId: string): Promise<number> {
  const subposts = await getSubpostsForParent(parentId)
  return subposts.length
}

export async function getCombinedReadingTime(postId: string): Promise<string> {
  const post = await getPostById(postId)
  if (!post) return readingTime(0)

  let totalWords = calculateWordCountFromHtml(post.body)

  if (!isSubpost(postId)) {
    const subposts = await getSubpostsForParent(postId)
    for (const subpost of subposts) {
      totalWords += calculateWordCountFromHtml(subpost.body)
    }
  }

  return readingTime(totalWords)
}

export async function getPostReadingTime(postId: string): Promise<string> {
  const post = await getPostById(postId)
  if (!post) return readingTime(0)

  const wordCount = calculateWordCountFromHtml(post.body)
  return readingTime(wordCount)
}

export type TOCHeading = {
  slug: string
  text: string
  depth: number
  displayDepth: number
  isSubpostTitle?: boolean
}

export type TOCSection = {
  type: 'parent' | 'subpost'
  title: string
  headings: TOCHeading[]
  subpostId?: string
}

function normalizeTOCHeadings(
  headings: { slug: string; text: string; depth: number }[],
): TOCHeading[] {
  const minDepth = Math.min(...headings.map((heading) => heading.depth))

  return headings.map((heading) => ({
    slug: heading.slug,
    text: heading.text,
    depth: heading.depth,
    displayDepth: Math.min(Math.max(heading.depth - minDepth + 1, 1), 6),
  }))
}

export async function getTOCSections(postId: string): Promise<TOCSection[]> {
  const post = await getPostById(postId)
  if (!post) return []

  const parentId = isSubpost(postId) ? getParentId(postId) : postId
  const parentPost = isSubpost(postId) ? await getPostById(parentId) : post

  if (!parentPost) return []

  const sections: TOCSection[] = []

  const { headings: parentHeadings } = await render(parentPost)
  if (parentHeadings.length > 0) {
    sections.push({
      type: 'parent',
      title: 'Overview',
      headings: normalizeTOCHeadings(parentHeadings),
    })
  }

  const subposts = await getSubpostsForParent(parentId)
  for (const subpost of subposts) {
    const { headings: subpostHeadings } = await render(subpost)
    if (subpostHeadings.length > 0) {
      sections.push({
        type: 'subpost',
        title: subpost.data.title ?? '',
        headings: normalizeTOCHeadings(subpostHeadings).map(
          (heading, index) => ({
            ...heading,
            isSubpostTitle: index === 0,
          }),
        ),
        subpostId: subpost.id,
      })
    }
  }

  return sections
}
