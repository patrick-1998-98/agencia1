import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const link = z.object({ label: z.string(), href: z.string() });

/** Legal pages (privacy, terms, cookies): one YAML file per page. */
const legal = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/legal' }),
  schema: z.object({
    seoTitle: z.string(),
    seoDescription: z.string(),
    title: z.string(),
    updated: z.coerce.date(),
    intro: z.string(),
    sections: z.array(
      z.object({
        heading: z.string(),
        body: z.string().optional(),
        items: z.array(z.string()).optional(),
      }),
    ),
  }),
});

/**
 * Per-page copy shared by the top-level pages: SEO, hero and closing CTA.
 * File name = page id (home.yaml, benefits.yaml…).
 */
const pages = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      seo: z.object({
        title: z.string(),
        description: z.string(),
      }),
      hero: z.object({
        eyebrow: z.string(),
        title: z.string(),
        description: z.string(),
        trust: z.string().optional(),
        background: image(),
        thumbnail: image().optional(),
      }),
      cta: z
        .object({
          eyebrow: z.string(),
          title: z.string(),
          description: z.string(),
          primary: link,
          secondary: link,
        })
        .optional(),
    }),
});

export const core = { legal, pages };
