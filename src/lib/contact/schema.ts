/**
 * Server-side validation for the three contact flows. Every string is
 * cleaned (control chars stripped, trimmed) before length checks run.
 */
import { z } from 'astro/zod';
import { cleanText } from './sanitize';

const line = (max: number) =>
  z
    .string()
    .transform((v) => cleanText(v))
    .pipe(z.string().max(max));
const text = (max: number) =>
  z
    .string()
    .transform((v) => cleanText(v, { multiline: true }))
    .pipe(z.string().max(max));
const required = (max: number) => line(max).pipe(z.string().min(1));
const email = line(254).pipe(z.email());

/** Fields shared by every flow for spam protection; checked separately. */
const antiSpam = {
  website: z.string().max(200).optional(),
  _t: z.coerce.number().int().nonnegative().optional(),
  'cf-turnstile-response': z.string().max(2048).optional(),
};

export const PROJECT_TYPES = ['brand', 'web', 'product', 'other'] as const;
export const TIMELINES = ['ASAP', '1–3 months', '3–6 months', 'Just exploring'] as const;
export const SERVICES = ['brand', 'web', 'product', 'other'] as const;
export const BRIEF_BUDGETS = ['Under $15k', '$15k – $45k', '$45k – $120k', '$120k+'] as const;
export const BRIEF_SERVICES = [
  'Brand',
  'Web',
  'Product',
  'Design system',
  'Front-end build',
  'Not sure yet',
] as const;
export const BUDGET_RANGE = { min: 5000, max: 150000, step: 5000 } as const;

/**
 * Spanish display labels for the enum values above. The submitted values stay
 * in English (they are what the schema validates); only the UI shows these.
 */
const CHOICE_LABELS: Record<string, string> = {
  ASAP: 'Lo antes posible',
  '1–3 months': '1–3 meses',
  '3–6 months': '3–6 meses',
  'Just exploring': 'Solo estoy explorando',
  'Under $15k': 'Menos de $15k',
  Brand: 'Marca',
  Product: 'Producto',
  'Design system': 'Sistema de diseño',
  'Front-end build': 'Desarrollo front-end',
  'Not sure yet': 'Todavía no sé',
};

/** Human-readable (Spanish) label for an enum value; falls back to the value itself. */
export const choiceLabel = (value: string): string => CHOICE_LABELS[value] ?? value;

const project = z.object({
  flow: z.literal('project'),
  projectType: z.enum(PROJECT_TYPES),
  budget: z.coerce
    .number()
    .int()
    .min(BUDGET_RANGE.min)
    .max(BUDGET_RANGE.max)
    .refine((n) => n % BUDGET_RANGE.step === 0, 'Invalid budget step'),
  timeline: z.enum(TIMELINES),
  goals: text(2000).optional().default(''),
  name: required(100),
  email,
  ...antiSpam,
});

const specialist = z.object({
  flow: z.literal('specialist'),
  service: z.enum(SERVICES),
  email,
  ...antiSpam,
});

/** Checkbox groups arrive as a string (one) or array (many) from forms. */
const chips = z
  .union([z.enum(BRIEF_SERVICES), z.array(z.enum(BRIEF_SERVICES)).max(BRIEF_SERVICES.length)])
  .optional()
  .transform((v) => (v === undefined ? [] : [...new Set(Array.isArray(v) ? v : [v])]));

const brief = z.object({
  flow: z.literal('brief'),
  name: required(100),
  email,
  company: line(120).optional().default(''),
  budget: z
    .union([z.enum(BRIEF_BUDGETS), z.literal('')])
    .optional()
    .default(''),
  services: chips,
  message: text(5000).pipe(z.string().min(1)),
  ...antiSpam,
});

export const contactSchema = z.discriminatedUnion('flow', [project, specialist, brief]);
export type ContactInput = z.input<typeof contactSchema>;
export type ContactSubmission = z.output<typeof contactSchema>;
export type ContactFlow = ContactSubmission['flow'];
