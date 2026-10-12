import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const artworks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artworks' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    year: z.number().int(),
    medium: z.string().optional(),
    dimensions: z.string().optional(),
    series: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    image: image(),
    description: z.string().optional(),
    alt: z.string(),
  }),
});

const series = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/series' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    cover: image().optional(),
  }),
});

export const collections = { artworks, series };
