/** Shared Tailwind class lists for the contact forms (mirrors the original UI kit). */

export const card = 'rounded-3xl border border-border bg-card p-6 text-card-foreground md:p-10';

const buttonBase =
  'inline-flex h-11 cursor-pointer items-center justify-center gap-0.5 rounded-full px-5 text-sm font-medium whitespace-nowrap select-none transition-[translate,background-color] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0';

export const buttonPrimary = `${buttonBase} bg-foreground text-background shadow-xs hover:bg-[color-mix(in_oklab,var(--color-foreground)_86%,var(--color-background))] disabled:bg-muted disabled:text-muted-foreground`;

export const buttonSecondary = `${buttonBase} border border-border bg-card text-foreground shadow-xs hover:bg-muted disabled:bg-muted disabled:text-[color-mix(in_oklab,var(--color-muted-foreground)_75%,var(--color-background))]`;

export const fieldLabel = 'text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase';

/** Wrapper of the planner/specialist inputs (ring style). */
export const fieldShell =
  'flex w-full rounded-2xl bg-background py-3 text-sm ring-1 ring-border transition-shadow ring-inset focus-within:ring-foreground has-[[aria-invalid=true]]:ring-red-500';

export const fieldControl =
  'block w-full min-w-0 border-0 bg-transparent p-0 px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground';

/** Brief form inputs (bordered style). */
export const briefInput =
  'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm transition-colors focus:border-foreground focus:outline-none aria-[invalid=true]:border-red-500';

export const briefLabel =
  'mb-2 block text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase';

export const eyebrow = 'text-xs tracking-[0.18em] text-muted-foreground uppercase';

export const stepTitle = 'text-2xl font-medium tracking-tight';

export const errorText = 'mt-3 text-sm text-red-600 dark:text-red-400';
