import type { APIContext } from 'astro'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function calculateWordCountFromHtml(
  html: string | null | undefined,
): number {
  if (!html) return 0
  const textOnly = html.replace(/<[^>]+>/g, '')
  return textOnly.split(/\s+/).filter(Boolean).length
}

export function readingTime(wordCount: number): string {
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200))
  return `${readingTimeMinutes} min read`
}

export function getTOCLevelClass(depth: number): string {
  const levels: Record<number, string> = {
    1: 'ml-0 text-sm font-semibold text-foreground/75',
    2: 'ml-4 text-[13px] font-medium text-foreground/62',
    3: 'ml-8 text-[13px] text-foreground/52',
    4: 'ml-12 text-xs text-foreground/45',
    5: 'ml-16 text-xs text-foreground/40',
    6: 'ml-20 text-xs text-foreground/35',
  }
  return levels[depth] || levels[6]
}

export function getHeadingMargin(depth: number): string {
  return getTOCLevelClass(depth)
}

// NOTE: this function is only used in ts files, in astro files, you can use Astro.url.origin directly. ref @PageHead.astro, @PostHead.astro
export function getSiteUrl(context: APIContext): URL {
  // for dev, use the context.origin.url
  if (import.meta.env.DEV) {
    return new URL(context.url.origin)
  }

  // for production, using the {site} from astro.config.ts (and fallback to the 'cloudflare worker' domain)
  return new URL(context.site || 'https://portfolio.theinfinull.workers.dev')
}
