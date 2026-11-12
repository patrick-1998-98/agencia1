import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Service practices (brand, web, product). One YAML file per service;
 * the file name is the URL slug (/services/<slug>).
 */
const serviceCollection = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      title: z.string(),
      /** One-liner used in the services grid and as the meta description. */
      summary: z.string(),
      intro: z.string(),
      tags: z.array(z.string()),
      image: image(),
      deliverables: z.array(z.string()),
      process: z.array(z.object({ step: z.string(), description: z.string() })),
    }),
});

export const services = { services: serviceCollection };
