/**
 * Builds the lead notification and sends it through Resend's HTTP API.
 * All user text is HTML-escaped in the HTML body; header values are
 * single-line and length-capped.
 */
import type { ContactSubmission } from './schema';
import { escapeHtml, headerSafe } from './sanitize';

export interface LeadEmail {
  subject: string;
  text: string;
  html: string;
  replyTo: string;
}

const FLOW_LABEL = { project: 'Project enquiry', specialist: 'Specialist request', brief: 'Project brief' } as const;
const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

function rows(data: ContactSubmission): [string, string][] {
  switch (data.flow) {
    case 'project':
      return [
        ['Name', data.name],
        ['Email', data.email],
        ['Project type', data.projectType],
        ['Budget', usd(data.budget)],
        ['Timeline', data.timeline],
        ['Goals', data.goals || '—'],
      ];
    case 'specialist':
      return [
        ['Email', data.email],
        ['Service', data.service],
      ];
    case 'brief':
      return [
        ['Name', data.name],
        ['Email', data.email],
        ['Company', data.company || '—'],
        ['Budget', data.budget || '—'],
        ['Needs', data.services.join(', ') || '—'],
        ['Brief', data.message],
      ];
  }
}

export function buildLeadEmail(data: ContactSubmission, ticket: string): LeadEmail {
  const who = data.flow === 'specialist' ? data.email : data.name;
  const subject = headerSafe(`[${ticket}] ${FLOW_LABEL[data.flow]} — ${who}`, 160);
  const list = rows(data);
  const text = [`${FLOW_LABEL[data.flow]} · ${ticket}`, '', ...list.map(([k, v]) => `${k}: ${v}`)].join('\n');
  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#111">
<h2 style="font-weight:500">${escapeHtml(FLOW_LABEL[data.flow])} · ${escapeHtml(ticket)}</h2>
<table cellpadding="6" style="border-collapse:collapse">${list
    .map(
      ([k, v]) =>
        `<tr><th align="left" valign="top" style="color:#666;font-weight:500">${escapeHtml(k)}</th><td style="white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
    )
    .join('')}</table></body></html>`;
  return { subject, text, html, replyTo: data.email };
}

export interface ResendConfig {
  apiKey: string;
  to: string;
  from: string;
}

export async function sendViaResend(
  mail: LeadEmail,
  config: ResendConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; status: number }> {
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: config.from,
        to: config.to.split(',').map((s) => s.trim()).filter(Boolean),
        reply_to: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok ? { ok: true } : { ok: false, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
