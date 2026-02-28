import { getCollection } from 'astro:content'
import { cn } from '@/lib/utils'

export type TimelineIconType = 'emoji' | 'icon' | 'color' | 'number' | 'image'

export type PolaroidVariant = '1x1' | '4x5' | '4x3' | '9x16'

export interface Photo {
  src: string
  alt: string
  width?: number
  height?: number
  variant: PolaroidVariant
  location?: string
  date?: string
  camera?: string
  description?: string
}

export interface PhotoData {
  title: string
  icon: {
    type: TimelineIconType
    value: string
    fallback?: string
  }
  description?: string
  date?: string
  endDate?: string
  photos: Photo[]
  location?: string
}

// 预先把 `src/content/photos/**/assets/*` 全部收集成 URL 映射，
// 这样正文里只写 `![](./assets/1.png)` 也能拿到打包后的真实地址。
const photoAssetMap = import.meta.glob('/src/content/photos/**/*.{png,jpg,jpeg,gif,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function resolvePhotoSrcFromBody(rawSrc: string, entryId: string): string {
  // 去掉 title 等多余部分，只保留 URL
  const [urlPart] = rawSrc.split(/\s+/)
  let src = urlPart.trim()

  if (!src) return ''

  // 外链直接返回
  if (/^https?:\/\//.test(src)) {
    return src
  }

  // 兼容写法：`/assets/1.png` 也按当前 entry 下的 assets 解析，
  // 而不是强制要求放在 public/assets 目录
  if (src.startsWith('/assets/')) {
    const entryDir = entryId.includes('/') ? entryId.slice(0, entryId.lastIndexOf('/')) : ''
    const rel = src.slice(1) // 去掉前导 `/`，变成 `assets/...`
    const key = `/src/content/photos/${entryDir ? `${entryDir}/` : ''}${rel}`
    return photoAssetMap[key] ?? src
  }

  // 其余以 / 开头的仍然当作 public 下的绝对路径
  if (src.startsWith('/')) {
    return src
  }

  // 去掉前导的 ./ 或 ../ 这类简单前缀（目前只支持同级 ./assets/*）
  src = src.replace(/^\.?\//, '')

  // entry.id 形如 `sample-1/sample-1`，取目录部分作为基准路径
  const entryDir = entryId.includes('/') ? entryId.slice(0, entryId.lastIndexOf('/')) : ''

  // 组装成我们在 glob 里使用的绝对源码路径
  const key = `/src/content/photos/${entryDir ? `${entryDir}/` : ''}${src}`

  return photoAssetMap[key] ?? src
}

/**
 * 从 photos 集合的 markdown 正文中提取 `![]()` 图片
 * - 支持正文里只写 `![](./assets/1.png)`
 * - 通过 import.meta.glob 把它们映射成构建后的 URL
 */
function extractPhotosFromMarkdown(
  body: string | undefined,
  fallbackTitle: string,
  entryId: string
): Photo[] {
  const photos: Photo[] = []
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  const content = body ?? ''

  let match: RegExpExecArray | null
  while ((match = imageRegex.exec(content)) !== null) {
    const alt = match[1]?.trim() || fallbackTitle
    const rawSrc = match[2]
    const resolvedSrc = resolvePhotoSrcFromBody(rawSrc, entryId)

    if (!resolvedSrc) continue

    photos.push({
      src: resolvedSrc,
      alt,
      // 宽高在这里不是必须的，交给浏览器自然布局
      variant: '4x3',
    })
  }

  return photos
}

export async function getPhotosTimeline(): Promise<PhotoData[]> {
  const entries = await getCollection('photos')

  const items: PhotoData[] = entries.map((entry) => {
    const {
      title = 'Untitled',
      description,
      startDate,
      endDate,
      iconType,
      favicon = '📷',
      location,
      images,
    } = entry.data as {
      title?: string
      description?: string
      startDate?: Date
      endDate?: Date
      iconType?: TimelineIconType
      favicon?: string
      location?: string
      // 这里不再直接引用 ImageMetadata 类型，只要结构兼容即可
      images?: { src: { src: string; width: number; height: number }; alt?: string }[]
    }

    // 先解析 favicon，支持相对路径（如 assets/image.png 或 ./assets/image.png）
    let resolvedFavicon = favicon
    let finalType: TimelineIconType

    if (iconType) {
      finalType = iconType
    } else if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(favicon ?? '')) {
      finalType = 'color'
    } else if (/^\d+$/.test(favicon ?? '')) {
      finalType = 'number'
    } else {
      // 其余情况：尝试按图片路径解析
      const maybeImage = favicon ? resolvePhotoSrcFromBody(favicon, entry.id) : ''

      if (maybeImage && maybeImage !== favicon) {
        // 成功解析成打包后的图片 URL
        resolvedFavicon = maybeImage
        finalType = 'image'
      } else if ((favicon ?? '').startsWith('/')) {
        // 以 / 开头的绝对路径（public 下的静态资源）
        finalType = 'image'
      } else {
        // 否则当作 emoji 使用
        finalType = 'emoji'
      }
    }

    // 1. 优先使用 frontmatter 声明的 images（支持 ./assets/xxx.png，和 blog 一样一个文件夹管理）
    let photos: Photo[] =
      images && images.length > 0
        ? images.map((img, index) => ({
            src: img.src.src,
            alt: img.alt || `${title || 'Untitled'} #${index + 1}`,
            width: img.src.width,
            height: img.src.height,
            variant: '4x3',
          }))
        : []

    // 2. 如果没有 images 字段，则回退到 markdown 正文里的 `![]()` 提取
    if (photos.length === 0) {
      photos = extractPhotosFromMarkdown(
        entry.body,
        String(title || 'Untitled'),
        String(entry.id || '')
      )
    }

    const dateString =
      startDate instanceof Date && !Number.isNaN(startDate.getTime())
        ? startDate.toISOString().slice(0, 10)
        : undefined

    const endDateString =
      endDate instanceof Date && !Number.isNaN(endDate.getTime())
        ? endDate.toISOString().slice(0, 10)
        : undefined

    return {
      title,
      description,
      date: dateString,
      endDate: endDateString,
      icon: {
        type: finalType,
        value: resolvedFavicon,
      },
      photos,
      location,
    }
  })

  // 按“结束日期”倒序排序（新的在前）：
  // - 优先使用 endDate
  // - 如果 endDate 为空，则用开始日期 date 作为结束日期
  // - 两个都没有的排在最后
  items.sort((a, b) => {
    const endA = a.endDate || a.date
    const endB = b.endDate || b.date

    if (!endA && !endB) return 0
    if (!endA) return 1
    if (!endB) return -1

    // 字符串格式为 YYYY-MM-DD，直接比较即可
    return endA < endB ? 1 : endA > endB ? -1 : 0
  })

  return items
}

