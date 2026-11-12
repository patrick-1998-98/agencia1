import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const sectionHeader = z.object({
  eyebrow: z.string(),
  title: z.string(),
  description: z.string(),
});

/**
 * FAQ sets (one YAML file per set): the /faq page list and the contact
 * page "Quick answers". Each group renders as its own accordion.
 */
const faqs = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/faq' }),
  schema: z.object({
    section: sectionHeader,
    groups: z.array(
      z.object({
        title: z.string(),
        items: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
      }),
    ),
  }),
});

const choice = z.object({ id: z.string(), title: z.string(), description: z.string() });

/** Copy and options for the contact page forms and the studio card. */
const contact = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/contact' }),
  schema: z.object({
    section: sectionHeader,
    tabs: z.array(
      z.object({
        id: z.enum(['project', 'specialist', 'brief']),
        label: z.string(),
        shortLabel: z.string(),
      }),
    ),
    project: z.object({
      projectTypes: z.array(choice),
      budget: z.object({
        min: z.number(),
        max: z.number(),
        step: z.number(),
        initial: z.number(),
        /** Budgets at or above this value get the "book a call" success state. */
        qualifiedFrom: z.number(),
      }),
      timelines: z.array(z.string()),
      bookingUrl: z.url(),
    }),
    specialist: z.object({
      services: z.array(
        z.object({ id: z.string(), label: z.string(), owner: z.string(), role: z.string() }),
      ),
    }),
    brief: z.object({
      budgets: z.array(z.string()),
      services: z.array(z.string()),
      submitLabel: z.string(),
      success: z.object({
        steps: z.array(z.string()),
        replyWithin: z.string(),
        bookingUrl: z.url(),
        caseStudies: z.array(z.object({ title: z.string(), href: z.string() })),
      }),
    }),
    studio: z.object({
      title: z.string(),
      items: z.array(
        z.object({
          label: z.string(),
          value: z.string(),
          href: z.string().optional(),
          icon: z.string(),
        }),
      ),
    }),
  }),
});

export const support = { faqs, contact };
