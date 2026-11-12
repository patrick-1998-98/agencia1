/**
 * Input hygiene for contact submissions. Pure functions, no I/O.
 */

// C0 controls except \t \n \r, DEL, C1 controls, zero-width and bidi overrides.
const CONTROL_CHARS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/** Strips control/invisible characters, normalises newlines and trims. */
export function cleanText(value: string, { multiline = false } = {}): string {
  let out = value.normalize('NFC').replace(/\r\n?/g, '\n').replace(CONTROL_CHARS, '');
  if (!multiline) out = out.replace(/\s+/g, ' ');
  else out = out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return out.trim();
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for interpolation into HTML element content or attributes. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

/** Single-line value safe for an email header (no CR/LF injection). */
export function headerSafe(value: string, max = 120): string {
  return cleanText(value)
    .replace(/[\r\n]/g, ' ')
    .slice(0, max);
}
