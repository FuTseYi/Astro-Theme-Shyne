type ReadingProgressOptions = {
    scrollY?: number
    viewportHeight?: number
    visibilityEndOffset?: number
}

export type ArticleReadingProgress = {
    progress: number
    percentage: number
    start: number
    end: number
    inRange: boolean
}

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)

export const getArticleReadingProgress = (
    article: HTMLElement,
    options: ReadingProgressOptions = {},
): ArticleReadingProgress => {
    const scrollY = options.scrollY ?? window.scrollY
    const viewportHeight = options.viewportHeight ?? window.innerHeight
    const visibilityEndOffset = options.visibilityEndOffset ?? 200

    const rect = article.getBoundingClientRect()
    const articleTop = scrollY + rect.top
    const articleHeight = article.scrollHeight

    const start = articleTop
    const end = Math.max(start + 1, articleTop + articleHeight - viewportHeight)
    const progress = clamp((scrollY - start) / (end - start), 0, 1)
    const percentage = Math.min(Math.round(progress * 100), 100)
    const inRange = scrollY > start && scrollY < end + visibilityEndOffset

    return {
        progress,
        percentage,
        start,
        end,
        inRange,
    }
}