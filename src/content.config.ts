import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).nullish(),
    order: z.number().nullish(),
    draft: z.boolean().optional(),
  }),
})

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(
      z.object({
        label: z.string(),
        icon: z.string().optional(),
      })
    ).nullish(),
    sourceCodeLink: z.string().url().nullish().or(z.literal('')),
    siteLink: z.string().url().nullish().or(z.literal('')),
    relatedBlogsLink: z.string().nullish().or(z.literal('')),
    startDate: z.coerce.date().nullish(),
    endDate: z.coerce.date().nullish(),
    featured: z.boolean().optional().default(false),
    order: z.number().nullish(),
  }),
})

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: ({ image }) =>
    z.object({
      role: z.string(),
      company: z.string(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date().nullish(),
      description: z.string(),
      location: z.string(),
      companyLogo: image().nullish(),
      companyUrl: z.string().url().nullish().or(z.literal('')),
      order: z.number().nullish(),
      tags: z.array(
        z.object({
          label: z.string(),
          icon: z.string().optional(),
        })
      ).nullish(),
    }),
})

export const collections = { blog, projects, experience }
