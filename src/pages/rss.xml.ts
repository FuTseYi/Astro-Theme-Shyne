import { FAVICON, SITE } from '@/config'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { getAllPosts } from '@/lib/data-utils'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

const parser = new MarkdownIt()

function stripInvalidXmlChars(str: string): string {
  return str.replace(
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
    ''
  )
}

function toAbsoluteUrl(pathOrUrl: string, baseUrl: string): string {
  try {
    return new URL(pathOrUrl, baseUrl).toString()
  } catch {
    return pathOrUrl
  }
}

// Main
export async function GET(_context: APIContext) {
  try {
    const posts = await getAllPosts()
    const siteUrl = SITE.href
    const iconUrl = toAbsoluteUrl(FAVICON.ico, siteUrl)
    const appleTouchIconUrl = toAbsoluteUrl(FAVICON.appleTouchIcon, siteUrl)

    return rss({
      title: SITE.title,
      description: SITE.description,
      site: siteUrl,
      stylesheet: '/rss/rss-styles.xsl',
      items: posts.map((post) => {
        const content = typeof post.body === 'string' ? post.body : String(post.body || '')
        const cleanedContent = stripInvalidXmlChars(content)

        return {
          title: post.data.title ?? '',
          description: post.data.description ?? undefined,
          pubDate: post.data.date ?? undefined,
          link: `/blog/${post.id}/`,
          content: sanitizeHtml(parser.render(cleanedContent), {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
          }),
        }
      }),
      customData: `<language>${SITE.locale ?? 'en'}</language><image><url>${iconUrl}</url><title>${SITE.title}</title><link>${siteUrl}</link></image><appleTouchIcon>${appleTouchIconUrl}</appleTouchIcon>`,
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}
