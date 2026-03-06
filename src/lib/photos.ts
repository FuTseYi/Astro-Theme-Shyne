import { getImage } from 'astro:assets'
import { getCollection } from 'astro:content'

export type TimelineIconType = 'emoji' | 'icon' | 'color' | 'number' | 'image'

export type PolaroidVariant = '1x1' | '4x5' | '4x3' | '9x16'

// 常量
const DEFAULT_PHOTO_VARIANT: PolaroidVariant = '4x3'
const DEFAULT_TITLE = 'Untitled'
const DEFAULT_FAVICON = '📷'
const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const NUMBER_PATTERN = /^\d+$/
const HTTP_URL_PATTERN = /^https?:\/\//
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)]+)\)/g

/** Photos Collection 条目数据结构 */
interface PhotoEntryData {
  title?: string
  description?: string
  startDate?: Date
  endDate?: Date
  iconType?: TimelineIconType
  favicon?: string
  location?: string
  images?: Array<{
    src: ImageMetadata
    alt?: string
  }>
}

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

// 预先把 `src/content/photos/**/assets/*` 全部收集出来。
// 注意：直接使用 metadata.src 可能在产物里找不到对应文件（Astro 会二次优化），
// 所以这里统一通过 getImage() 生成最终可访问的 URL。
type PhotoAssetImport = string | ImageMetadata

const rawPhotoAssetMap = import.meta.glob(
  '/src/content/photos/**/*.{png,jpg,jpeg,gif,webp,avif,svg,PNG,JPG,JPEG,GIF,WEBP,AVIF,SVG}',
  {
    eager: true,
    import: 'default',
  }
) as Record<string, PhotoAssetImport>

interface PhotoAssetIndex {
  exact: Map<string, string>
  caseInsensitive: Map<string, string>
}

let photoAssetIndexPromise: Promise<PhotoAssetIndex> | undefined
const optimizedImageSrcCache = new Map<string, Promise<string>>()

function isImageMetadata(value: PhotoAssetImport): value is ImageMetadata {
  return typeof value === 'object' && value !== null && 'src' in value
}

async function getOptimizedImageSrc(image: ImageMetadata): Promise<string> {
  const cacheKey = image.src
  const cached = optimizedImageSrcCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const task = (async () => {
    try {
      const optimized = await getImage({ src: image })
      return optimized.src
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(`[Photos] Failed to optimize image: ${image.src}`, error)
      }
      return image.src
    }
  })()

  optimizedImageSrcCache.set(cacheKey, task)
  return task
}

async function getPhotoAssetIndex(): Promise<PhotoAssetIndex> {
  if (!photoAssetIndexPromise) {
    photoAssetIndexPromise = (async () => {
      const entries = await Promise.all(
        Object.entries(rawPhotoAssetMap).map(async ([key, value]) => {
          if (!isImageMetadata(value)) {
            return [key, value] as const
          }

          const optimizedSrc = await getOptimizedImageSrc(value)
          return [key, optimizedSrc] as const
        })
      )

      const exact = new Map<string, string>(entries)
      const caseInsensitive = new Map<string, string>(
        entries.map(([key, value]) => [key.toLowerCase(), value])
      )

      return { exact, caseInsensitive }
    })()
  }

  return photoAssetIndexPromise
}

/**
 * 从 entry ID 中提取目录路径
 * @param entryId - 集合条目 ID，格式如 "folder/index" 或 "folder"
 * @returns 目录路径
 */
function getEntryDir(entryId: string): string {
  return entryId.includes('/') ? entryId.slice(0, entryId.lastIndexOf('/')) : entryId
}

/**
 * 解析照片资源路径
 * @param rawSrc - 原始路径（来自 markdown）
 * @param entryId - 集合条目 ID
 * @returns 解析后的 URL 或原始路径
 */
async function resolvePhotoSrcFromBody(rawSrc: string, entryId: string): Promise<string> {
  // 去掉 title 等多余部分，只保留 URL
  const [urlPart] = rawSrc.split(/\s+/)
  let src = urlPart.trim()

  if (!src) return ''

  // 外链直接返回
  if (HTTP_URL_PATTERN.test(src)) {
    return src
  }

  // 兼容写法：`/assets/1.png` 也按当前 entry 下的 assets 解析，
  // 而不是强制要求放在 public/assets 目录
  if (src.startsWith('/assets/')) {
    const entryDir = getEntryDir(entryId)
    const rel = src.slice(1) // 去掉前导 `/`，变成 `assets/...`
    const key = `/src/content/photos/${entryDir ? `${entryDir}/` : ''}${rel}`
    const photoAssetIndex = await getPhotoAssetIndex()
    const resolved = photoAssetIndex.exact.get(key)
    return resolved ?? src
  }

  // 其余以 / 开头的仍然当作 public 下的绝对路径
  if (src.startsWith('/')) {
    return src
  }

  // 去掉前导的 ./ 或 ../ 这类简单前缀（目前只支持同级 ./assets/*）
  src = src.replace(/^\.?\//, '')

  const entryDir = getEntryDir(entryId)
  const key = `/src/content/photos/${entryDir ? `${entryDir}/` : ''}${src}`
  const photoAssetIndex = await getPhotoAssetIndex()

  // 先尝试精确匹配
  const exactMatched = photoAssetIndex.exact.get(key)
  if (exactMatched) {
    return exactMatched
  }

  // 如果精确匹配失败，尝试不区分大小写匹配（O(1) 查找）
  const resolved = photoAssetIndex.caseInsensitive.get(key.toLowerCase())
  if (resolved) {
    return resolved
  }

  // 开发环境警告未找到的资源
  if (import.meta.env.DEV) {
    console.warn(`[Photos] Image not found: "${rawSrc}" (resolved key: "${key}")`)
  }

  return src
}

/**
 * 从 photos 集合的 markdown 正文中提取 `![]()` 图片
 * @param body - Markdown 正文内容
 * @param fallbackTitle - 当图片没有 alt 文本时使用的标题
 * @param entryId - 集合条目 ID
 * @returns 照片数组
 */
async function extractPhotosFromMarkdown(
  body: string | undefined,
  fallbackTitle: string,
  entryId: string
): Promise<Photo[]> {
  const photos: Photo[] = []
  const content = body ?? ''

  // 使用 matchAll 避免全局正则的 lastIndex 状态问题
  const matches = content.matchAll(MARKDOWN_IMAGE_PATTERN)

  for (const match of matches) {
    const alt = match[1]?.trim() || fallbackTitle
    const rawSrc = match[2]
    const resolvedSrc = await resolvePhotoSrcFromBody(rawSrc, entryId)

    if (!resolvedSrc) continue

    photos.push({
      src: resolvedSrc,
      alt,
      variant: DEFAULT_PHOTO_VARIANT,
    })
  }

  return photos
}

/**
 * 格式化日期为 ISO 字符串
 * @param date - 日期对象
 * @returns ISO 格式的日期字符串或 undefined
 */
function formatDate(date?: Date): string | undefined {
  return date instanceof Date && !Number.isNaN(date.getTime())
    ? date.toISOString().slice(0, 10)
    : undefined
}

/**
 * 解析并推断 favicon 的类型
 * @param favicon - 原始 favicon 值
 * @param iconType - 显式指定的图标类型
 * @param entryId - 集合条目 ID
 * @returns 包含解析后值和类型的对象
 */
async function resolveFavicon(
  favicon: string,
  iconType: TimelineIconType | undefined,
  entryId: string
): Promise<{ value: string; type: TimelineIconType }> {
  // 显式指定了类型，直接使用
  if (iconType) {
    return { value: favicon, type: iconType }
  }

  // 颜色值
  if (HEX_COLOR_PATTERN.test(favicon)) {
    return { value: favicon, type: 'color' }
  }

  // 数字
  if (NUMBER_PATTERN.test(favicon)) {
    return { value: favicon, type: 'number' }
  }

  // 图片路径（需要解析）
  if (favicon.startsWith('/') || favicon.startsWith('./') || favicon.startsWith('assets/')) {
    const resolved = await resolvePhotoSrcFromBody(favicon, entryId)
    const isImage = resolved !== favicon || favicon.startsWith('/')
    return { value: resolved, type: isImage ? 'image' : 'emoji' }
  }

  // 默认当作 emoji
  return { value: favicon, type: 'emoji' }
}

/**
 * 获取照片时间线数据
 * @returns 按结束日期倒序排列的照片数据数组
 */
export async function getPhotosTimeline(): Promise<PhotoData[]> {
  const entries = await getCollection('photos')

  const items: PhotoData[] = await Promise.all(entries.map(async (entry) => {
    const data = entry.data as PhotoEntryData
    const {
      title = DEFAULT_TITLE,
      description,
      startDate,
      endDate,
      iconType,
      favicon = DEFAULT_FAVICON,
      location,
      images,
    } = data

    // 解析 favicon
    const icon = await resolveFavicon(favicon, iconType, entry.id)

    // 1. 优先使用 frontmatter 声明的 images
    let photos: Photo[] =
      images && images.length > 0
        ? await Promise.all(
          images.map(async (img, index) => {
            const resolvedSrc = await getOptimizedImageSrc(img.src)
            return {
              src: resolvedSrc,
              alt: img.alt || `${title} #${index + 1}`,
              width: img.src.width,
              height: img.src.height,
              variant: DEFAULT_PHOTO_VARIANT,
            }
          })
        )
        : []

    // 2. 如果没有 images 字段，则回退到 markdown 正文里的 `![]()` 提取
    if (photos.length === 0) {
      photos = await extractPhotosFromMarkdown(entry.body, title, entry.id)
    }

    return {
      title,
      description,
      date: formatDate(startDate),
      endDate: formatDate(endDate),
      icon: {
        type: icon.type,
        value: icon.value,
      },
      photos,
      location,
    }
  }))

  // 按结束日期倒序排序（新的在前）
  items.sort((a, b) => {
    const endA = a.endDate || a.date
    const endB = b.endDate || b.date

    if (!endA && !endB) return 0
    if (!endA) return 1
    if (!endB) return -1

    return endB.localeCompare(endA) // YYYY-MM-DD 格式可直接字符串比较
  })

  return items
}

