/**
 * POST /api/contact — receives all three contact flows.
 *
 * Accepts JSON (the enhanced client) or form-encoded bodies (no-JS fallback).
 * Form posts that accept HTML get a 303 redirect to /contact/sent (success)
 * or back to /contact with an error flag, so the brief form works without JS.
 */
import type { APIRoute } from 'astro';
import {
  CONTACT_FROM_EMAIL,
  CONTACT_TO_EMAIL,
  RESEND_API_KEY,
  TURNSTILE_SECRET_KEY,
} from 'astro:env/server';
import { PUBLIC_TURNSTILE_SITE_KEY } from 'astro:env/client';
import { contactSchema } from '@/lib/contact/schema';
import { checkSpam } from '@/lib/contact/spam';
import { clientIp, createRateLimiter } from '@/lib/contact/rate-limit';
import { verifyTurnstile } from '@/lib/contact/turnstile';
import { buildLeadEmail, sendViaResend } from '@/lib/contact/email';
import { createTicket } from '@/lib/contact/ticket';

export const prerender = false;

const MAX_BODY_BYTES = 32 * 1024;
/** Render's proxy appends one X-Forwarded-For hop. */
const TRUSTED_PROXY_HOPS = 1;
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

type ErrorCode =
  | 'invalid'
  | 'forbidden'
  | 'too-large'
  | 'unsupported'
  | 'rate-limited'
  | 'unavailable'
  | 'verification';

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });

function formToObject(form: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(form.keys())) {
    const values = form.getAll(key).filter((v): v is string => typeof v === 'string');
    out[key] = key === 'services' ? values : (values[0] ?? '');
  }
  return out;
}

/** JSON requests aren't covered by Astro's checkOrigin, so verify here too. */
function isSameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return false;
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;
  return true;
}

export const POST: APIRoute = async ({ request, url, clientAddress, redirect }) => {
  const contentType =
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? '';
  const isForm =
    contentType === 'application/x-www-form-urlencoded' || contentType === 'multipart/form-data';
  const wantsHtml = isForm && (request.headers.get('accept') ?? '').includes('text/html');

  const fail = (
    code: ErrorCode,
    status: number,
    extra: Record<string, unknown> = {},
    headers: Record<string, string> = {},
  ) =>
    wantsHtml
      ? redirect(`/contact/sent?error=${code}`, 303)
      : json({ error: code, ...extra }, status, headers);

  if (!isSameOrigin(request, url)) return fail('forbidden', 403);
  if (!isForm && contentType !== 'application/json') return fail('unsupported', 415);

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return fail('too-large', 413);

  let ip = 'unknown';
  try {
    ip = clientIp(request.headers.get('x-forwarded-for'), clientAddress, TRUSTED_PROXY_HOPS);
  } catch {
    ip = clientIp(request.headers.get('x-forwarded-for'), undefined, TRUSTED_PROXY_HOPS);
  }
  const limited = limiter.check(ip);
  if (!limited.ok) {
    return fail('rate-limited', 429, {}, { 'Retry-After': String(limited.retryAfter) });
  }

  let raw: unknown;
  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES)
      return fail('too-large', 413);
    if (isForm) {
      // Body is already size-checked; re-wrap it so the platform parser handles both encodings.
      const form = await new Response(bodyText, {
        headers: { 'Content-Type': request.headers.get('content-type') ?? contentType },
      }).formData();
      raw = formToObject(form);
    } else {
      raw = JSON.parse(bodyText);
    }
  } catch {
    return fail('invalid', 400);
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0] ?? 'form')))];
    return fail('invalid', 400, { fields });
  }
  const data = parsed.data;

  // Bots get a convincing success so they don't retry; nothing is sent.
  if (checkSpam(data) !== 'ok') {
    const ticket = createTicket();
    return wantsHtml ? redirect(`/contact/sent?ticket=${ticket}`, 303) : json({ ticket });
  }

  if (TURNSTILE_SECRET_KEY && PUBLIC_TURNSTILE_SITE_KEY) {
    const passed = await verifyTurnstile(data['cf-turnstile-response'], TURNSTILE_SECRET_KEY, ip);
    if (!passed) return fail('verification', 400);
  }

  const ticket = createTicket();
  const mail = buildLeadEmail(data, ticket);

  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    if (import.meta.env.PROD) {
      console.error(
        '[contact] Email delivery is not configured (RESEND_API_KEY / CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL).',
      );
      return fail('unavailable', 503);
    }
    console.warn(`[contact] dev: email not configured, lead ${ticket} not sent:\n${mail.text}`);
  } else {
    const sent = await sendViaResend(mail, {
      apiKey: RESEND_API_KEY,
      to: CONTACT_TO_EMAIL,
      from: CONTACT_FROM_EMAIL,
    });
    if (!sent.ok) {
      console.error(`[contact] Resend rejected lead ${ticket} (status ${sent.status}).`);
      return fail('unavailable', 502);
    }
  }

  return wantsHtml
    ? redirect(`/contact/sent?ticket=${ticket}&flow=${data.flow}`, 303)
    : json({ ticket });
};

export const ALL: APIRoute = () => json({ error: 'method-not-allowed' }, 405, { Allow: 'POST' });
