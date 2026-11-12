/**
 * Tiny escape-by-default HTML templating used for both the server render
 * (Astro `set:html`) and client re-renders. Interpolated values are escaped
 * unless wrapped in `raw()` or produced by another `html` call.
 */

const SAFE = Symbol('safe-html');

export interface SafeHtml {
  readonly [SAFE]: true;
  readonly value: string;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);

export const raw = (value: string): SafeHtml => ({ [SAFE]: true, value });

const isSafe = (v: unknown): v is SafeHtml => typeof v === 'object' && v !== null && SAFE in v;

type Value = SafeHtml | string | number | boolean | null | undefined | Value[];

const stringify = (v: Value): string => {
  if (v === null || v === undefined || v === false) return '';
  if (Array.isArray(v)) return v.map(stringify).join('');
  if (isSafe(v)) return v.value;
  return escapeHtml(String(v));
};

export function html(strings: TemplateStringsArray, ...values: Value[]): SafeHtml {
  let out = strings[0] ?? '';
  values.forEach((v, i) => {
    out += stringify(v) + (strings[i + 1] ?? '');
  });
  return raw(out);
}

/** Class list helper: falsy entries are dropped. */
export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');
