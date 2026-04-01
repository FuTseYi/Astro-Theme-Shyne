import { glob } from 'astro/loaders'
import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'

const optionalDate = z.preprocess((value) => {
  // YAML `endDate:` (empty) becomes `null`, and z.coerce.date() would turn it into 1970-01-01.
  // Treat null/undefined/empty-string as "not provided".
  if (value === null || value === undefined || value === '') return undefined
  return value
}, z.coerce.date().optional())

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().nullish(),
    description: z.string().nullish(),
    date: optionalDate,
    tags: z.array(z.string()).nullish(),
    order: z.number().nullish(),
    draft: z.boolean().nullish(),
  }),
})

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    name: z.string().nullish(),
    description: z.string().nullish(),
    startDate: optionalDate,
    endDate: optionalDate,
    sourceCodeLink: z.string().nullish().or(z.literal('')),
    siteLink: z.string().nullish().or(z.literal('')),
    relatedBlogsLink: z.string().nullish().or(z.literal('')),
    tags: z.array(z.string()).nullish(),
    featured: z.boolean().nullish(),
    order: z.number().nullish(),
  }),
})

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: ({ image }) =>
    z.object({
      role: z.string().nullish(),
      company: z.string().nullish(),
      description: z.string().nullish(),
      startDate: optionalDate,
      endDate: optionalDate,
      location: z.string().nullish(),
      companyLogo: image().nullish(),
      companyUrl: z.string().nullish().or(z.literal('')),
      tags: z.array(z.string()).nullish(),
    }),
})

const photos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/photos' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().nullish(),
      description: z.string().nullish(),
      startDate: optionalDate,
      endDate: optionalDate,
      iconType: z.enum(['emoji', 'icon', 'color', 'number', 'image']).nullish(),
      favicon: z.string().nullish().or(z.literal('')),
      location: z.string().nullish(),
      /**
       * 可选：像 blog 一样，把图片放在同一文件夹的 assets 里，
       * 用 frontmatter 显式声明，支持 Astro 的 image() 管线：
       *
       * images:
       *   - src: ./assets/1.png
       *     alt: Foo
       *
       * 这里的 src 是相对路径字符串，image() 会在构建时解析它。
       */
      images: z
        .array(
          z.object({
            src: image(),
            alt: z.string().optional(),
          }),
        )
        .optional(),
    }),
})

export const collections = { blog, projects, experience, photos }
