import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Case studies: one YAML file per project in src/content/portfolio/.
 * The file name is the URL slug (/portfolios/<slug>); `order` sets the
 * position in the carousel (001, 002…).
 */
const projects = defineCollection({
  loader: glob({ pattern: '[!_]*.yaml', base: './src/content/portfolio' }),
  schema: ({ image }) => {
    /** A still image, or a remote video with a local poster still. */
    const media = z.object({
      image: image(),
      video: z.url().optional(),
    });
    return z.object({
      order: z.number().int(),
      title: z.string(),
      category: z.string(),
      client: z.string(),
      year: z.number().int(),
      role: z.string(),
      description: z.string(),
      /** Lead visual: shown in the carousel and at the top of the case study. */
      cover: media,
      gallery: z.array(media).default([]),
    });
  },
});

/**
 * Copy for the /portfolios page sections (tools marquee, carousel heading,
 * highlight cards). Entries are keyed by section in _page.yaml.
 */
const portfolioPage = defineCollection({
  loader: file('./src/content/portfolio/_page.yaml'),
  schema: z.object({
    label: z.string().optional(),
    eyebrow: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    items: z.array(z.object({ name: z.string(), logo: z.string() })).optional(),
    cards: z.array(z.object({ title: z.string(), text: z.string() })).optional(),
  }),
});

export const portfolio = { portfolio: projects, portfolioPage };
