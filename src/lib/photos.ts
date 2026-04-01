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
  filenameIndex?: Map<string, string>
}

let photoAssetIndexPromise: Promise<PhotoAssetIndex> | undefined
const optimizedImageSrcCache = new Map<string, Promise<string>>()

/**
 * 类型守卫：检查值是否为 ImageMetadata
 */
function isImageMetadata(value: PhotoAssetImport): value is ImageMetadata {
  return typeof value === 'object' && value !== null && 'src' in value
}

/**
 * 规范化路径为绝对路径（确保以 / 开头）
 * @param path - 原始路径
 * @returns 规范化后的绝对路径
 */
function normalizeAbsolutePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * 获取优化后的图片 URL
 * 使用缓存机制避免重复优化同一张图片
 * @param image - 图片元数据
 * @returns 优化后的图片 URL（绝对路径）
 */
async function getOptimizedImageSrc(image: ImageMetadata): Promise<string> {
  const cacheKey = image.src
  const cached = optimizedImageSrcCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const task = (async () => {
    try {
      const optimized = await getImage({ src: image })
      // getImage() 返回的路径应该已经是绝对路径，但为了安全起见进行规范化
      return normalizeAbsolutePath(optimized.src)
    } catch (error) {
      // 错误处理：开发环境输出警告，生产环境静默失败但返回原始路径
      if (import.meta.env.DEV) {
        console.warn(`[Photos] Failed to optimize image: ${image.src}`, error)
      }
      // Fallback: 返回原始路径（规范化后）
      return normalizeAbsolutePath(image.src)
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
            // 对于字符串路径，规范化后返回
            const src = typeof value === 'string' ? value : String(value)
            return [key, normalizeAbsolutePath(src)] as const
          }

          const optimizedSrc = await getOptimizedImageSrc(value)
          return [key, optimizedSrc] as const
        })
      )

      const exact = new Map<string, string>(entries)
      const caseInsensitive = new Map<string, string>(
        entries.map(([key, value]) => [key.toLowerCase(), value])
      )

      // 同时创建一个基于文件名的索引，用于 fallback 匹配
      // 例如：/src/content/photos/Red Bird Challenge Camp/assets/DSC02898.JPG -> DSC02898.JPG
      const filenameIndex = new Map<string, string>()
      for (const [key, value] of entries) {
        const filename = key.split('/').pop()?.toLowerCase()
        if (filename && !filenameIndex.has(filename)) {
          filenameIndex.set(filename, value)
        }
      }

      return { exact, caseInsensitive, filenameIndex }
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
  const [urlPart] = rawSrc.split(/\s+/)
  const src = urlPart.trim()

  if (!src) return ''
  if (HTTP_URL_PATTERN.test(src)) return src
  // 绝对路径视为 public 目录资源，直接返回
  if (src.startsWith('/')) return src

  // 标准格式：./assets/img.png — 剥去 ./ 后拼接完整 glob key
  const rel = src.replace(/^\.\//, '')
  const entryDir = getEntryDir(entryId)
  const key = `/src/content/photos/${entryDir ? `${entryDir}/` : ''}${rel}`
  const photoAssetIndex = await getPhotoAssetIndex()

  const exactMatched = photoAssetIndex.exact.get(key)
  if (exactMatched) {
    return exactMatched
  }

  // 大小写不敏感兜底（兼容不同 OS 文件系统）
  const resolved = photoAssetIndex.caseInsensitive.get(key.toLowerCase())
  if (resolved) {
    return resolved
  }

  // 如果找不到匹配的图片，尝试直接查找 assets 目录下的文件
  // 这可能发生在 entry ID 格式不匹配的情况下
  const fallbackKey = `/src/content/photos/${entryDir ? `${entryDir}/` : ''}assets/${rel.split('/').pop()}`
  const fallbackMatch = photoAssetIndex.caseInsensitive.get(fallbackKey.toLowerCase())
  if (fallbackMatch) {
    return fallbackMatch
  }

  // 最后尝试通过文件名匹配（不区分大小写）
  const filename = rel.split('/').pop()?.toLowerCase()
  if (filename && photoAssetIndex.filenameIndex) {
    const filenameMatch = photoAssetIndex.filenameIndex.get(filename)
    if (filenameMatch) {
      return filenameMatch
    }
  }

  if (import.meta.env.DEV) {
    console.warn(`[Photos] Image not found: "${rawSrc}" (resolved key: "${key}", fallback: "${fallbackKey}", filename: "${filename}")`)
    console.warn(`[Photos] Entry ID: "${entryId}", Entry Dir: "${entryDir}"`)
  }

  // Fallback: 如果找不到匹配的图片，返回规范化后的原始路径
  const normalizedSrc = src.replace(/^\.\//, '')
  return normalizeAbsolutePath(normalizedSrc)
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

  // 图片路径：绝对路径或标准相对路径 ./assets/
  if (favicon.startsWith('/') || favicon.startsWith('./')) {
    const resolved = await resolvePhotoSrcFromBody(favicon, entryId)
    return { value: resolved, type: 'image' }
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

