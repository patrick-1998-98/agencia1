import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Eyebrow pill + h2 + lead paragraph shown above most sections. */
const header = z.object({
  eyebrow: z.string(),
  title: z.string(),
  description: z.string(),
});

/**
 * Reusable section copy for the marketing pages (home, benefits, services).
 * One YAML file per block in src/content/sections/; `type` selects the shape.
 */
const sections = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/sections' }),
  schema: ({ image }) =>
    z.discriminatedUnion('type', [
      z.object({ type: z.literal('header'), ...header.shape }),
      z.object({
        type: z.literal('stats'),
        items: z.array(
          z.object({ value: z.number(), suffix: z.string().default(''), label: z.string() }),
        ),
      }),
      z.object({
        type: z.literal('process'),
        header,
        discovery: z.object({ current: z.string(), target: z.string(), summary: z.string() }),
        design: z.object({
          stat: z.string(),
          /** Smaller text right after the big stat (e.g. "objetivo por fase"). */
          unit: z.string().optional(),
          /** Bold lead-in of the paragraph. */
          label: z.string().optional(),
          description: z.string(),
        }),
        person: z.string().default('Diseñador senior'),
        status: z
          .object({ done: z.string(), active: z.string() })
          .default({ done: 'Assets entregados', active: 'Handoff del sistema' }),
        delivery: z.object({ step: z.string(), duration: z.string() }),
        reliability: z.object({ percent: z.number(), label: z.string() }),
        pace: z.object({ value: z.string(), label: z.string() }),
        stack: z.array(z.string()),
        stackTitle: z.string().default('Nuestro stack'),
        stackNote: z
          .string()
          .default('Un stack acotado: rápido para construir, fácil de traspasar.'),
      }),
      z.object({
        type: z.literal('showcase'),
        cells: z.object({
          team: z.object({
            title: z.string(),
            description: z.string(),
            hub: z.string(),
            disciplines: z.array(z.object({ icon: z.string(), label: z.string() })),
          }),
          brief: z.object({
            title: z.string(),
            description: z.string(),
            studio: z.string(),
            status: z.string(),
            request: z.object({ text: z.string(), time: z.string() }),
            reply: z.string(),
            plan: z.object({
              title: z.string(),
              rows: z.array(
                z.object({ label: z.string(), value: z.string(), muted: z.boolean().optional() }),
              ),
              tags: z.array(z.string()),
              time: z.string(),
            }),
            draft: z.string(),
          }),
          handoff: z.object({
            title: z.string(),
            description: z.string(),
            kit: z.string(),
            items: z.array(z.object({ icon: z.string(), label: z.string() })),
          }),
          code: z.object({
            title: z.string(),
            description: z.string(),
            before: z.object({
              label: z.string(),
              items: z.array(z.object({ icon: z.string(), label: z.string() })),
            }),
            after: z.object({ label: z.string(), title: z.string() }),
          }),
          stack: z.object({
            title: z.string(),
            description: z.string(),
            tools: z.array(z.object({ icon: z.string(), label: z.string() })),
          }),
        }),
      }),
      z.object({
        type: z.literal('benefits'),
        header,
        items: z.array(
          z.object({
            icon: z.string(),
            title: z.string(),
            description: z.string(),
            stat: z.string(),
          }),
        ),
      }),
      z.object({
        type: z.literal('quote'),
        quote: z.string(),
        name: z.string(),
        role: z.string(),
        company: z.string(),
        avatar: image(),
      }),
      z.object({
        type: z.literal('pricing'),
        header,
        plans: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            price: z.string(),
            period: z.string(),
            features: z.array(z.string()),
            cta: z.object({ label: z.string(), href: z.string() }),
            featured: z.boolean().default(false),
          }),
        ),
      }),
      z.object({
        type: z.literal('roi'),
        header,
        columns: z.array(
          z.object({
            icon: z.string(),
            title: z.string(),
            hours: z.number(),
            points: z.array(z.string()),
            roi: z.number(),
          }),
        ),
      }),
    ]),
});

/** Client testimonials shown in the scrolling columns on the home page. */
const testimonials = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/testimonials' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      company: z.string(),
      /** Letter shown in the small badge on the avatar. */
      badge: z.string().length(1),
      avatar: image(),
      quote: z.string(),
      /** Column (1–4) and position inside it. */
      column: z.number().int().min(1).max(4),
      order: z.number().int(),
    }),
});

export const home = { sections, testimonials };
