import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

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
    sourceCodeLink: z.string().url().nullish().or(z.literal('')),
    siteLink: z.string().url().nullish().or(z.literal('')),
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
      companyUrl: z.string().url().nullish().or(z.literal('')),
      tags: z.array(z.string()).nullish(),
    }),
})

export const collections = { blog, projects, experience }
