/**
 * Client behaviour for the contact flows: tabs, the 4-step planner, the
 * specialist routing preview, in-place submission (idle → sending →
 * success | error) and lazy Cloudflare Turnstile.
 */
import { PUBLIC_TURNSTILE_SITE_KEY } from 'astro:env/client';

type SubmitResult =
  { ok: true; ticket: string } | { ok: false; message: string; fields?: string[] };

const GENERIC_ERROR = 'Something went wrong. Please try again.';
const ERRORS: Record<string, string> = {
  invalid: 'Please check the highlighted fields and try again.',
  'rate-limited': 'Too many messages in a short time. Please try again in a few minutes.',
  verification: 'We could not verify you are human. Please try again.',
};

const $ = <T extends Element = HTMLElement>(root: ParentNode, sel: string) =>
  root.querySelector<T & Element>(sel);
const $$ = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => [
  ...root.querySelectorAll<T & Element>(sel),
];
const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

/* ------------------------------------------------------------------ tabs */

function initTabs(root: HTMLElement) {
  const tabs = $$<HTMLButtonElement>(root, '[role=tab]');
  const select = (tab: HTMLButtonElement, focus = false) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls') ?? '');
      panel?.toggleAttribute('data-active', on);
    }
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const n = tabs.length;
      const next = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[
        e.key
      ];
      if (next === undefined) return;
      e.preventDefault();
      const target = tabs[next];
      if (target) select(target, true);
    });
  });
}

/* ------------------------------------------------------------- turnstile */

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const siteKey = PUBLIC_TURNSTILE_SITE_KEY;
let turnstileLoad: Promise<TurnstileApi> | undefined;
const widgets = new WeakMap<
  HTMLFormElement,
  { id?: string; token?: string; waiters: ((t: string) => void)[] }
>();

function loadTurnstile(): Promise<TurnstileApi> {
  turnstileLoad ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile'));
    s.onerror = () => reject(new Error('turnstile'));
    document.head.append(s);
  });
  return turnstileLoad;
}

function armTurnstile(form: HTMLFormElement) {
  if (!siteKey || widgets.has(form)) return;
  const state: { id?: string; token?: string; waiters: ((t: string) => void)[] } = { waiters: [] };
  widgets.set(form, state);
  const slot = $(form, '[data-turnstile]');
  if (!slot) return;
  loadTurnstile()
    .then((api) => {
      state.id = api.render(slot, {
        sitekey: siteKey,
        appearance: 'interaction-only',
        callback: (token: string) => {
          state.token = token;
          state.waiters.splice(0).forEach((w) => w(token));
        },
        'expired-callback': () => delete state.token,
      });
    })
    .catch(() => {
      /* Submission will fail verification and show the error state. */
    });
}

function turnstileToken(form: HTMLFormElement, timeoutMs = 15_000): Promise<string | undefined> {
  if (!siteKey) return Promise.resolve(undefined);
  armTurnstile(form);
  const state = widgets.get(form);
  if (!state) return Promise.resolve(undefined);
  if (state.token) return Promise.resolve(state.token);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(undefined), timeoutMs);
    state.waiters.push((t) => {
      clearTimeout(timer);
      resolve(t);
    });
  });
}

function resetTurnstile(form: HTMLFormElement) {
  const state = widgets.get(form);
  if (state?.id && window.turnstile) {
    delete state.token;
    window.turnstile.reset(state.id);
  }
}

/* ------------------------------------------------------------ submission */

function payload(form: HTMLFormElement): Record<string, unknown> {
  const data = new FormData(form);
  const out: Record<string, unknown> = {};
  for (const key of new Set(data.keys())) {
    const values = data.getAll(key).filter((v): v is string => typeof v === 'string');
    out[key] = key === 'services' ? values : values[0];
  }
  return out;
}

async function send(form: HTMLFormElement): Promise<SubmitResult> {
  const body = payload(form);
  const token = await turnstileToken(form);
  if (token) body['cf-turnstile-response'] = token;
  try {
    const res = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ticket?: string;
      error?: string;
      fields?: string[];
    };
    if (res.ok && data.ticket) return { ok: true, ticket: data.ticket };
    const message = (data.error && ERRORS[data.error]) || GENERIC_ERROR;
    return data.fields ? { ok: false, message, fields: data.fields } : { ok: false, message };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}

function markInvalid(form: HTMLFormElement, names: string[]) {
  for (const el of $$<HTMLInputElement>(form, '[name]')) {
    if (el.type === 'hidden') continue;
    const bad = names.includes(el.name);
    if (bad) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }
  const first = $$<HTMLInputElement>(form, '[aria-invalid=true]')[0];
  first?.focus();
}

function invalidFields(form: HTMLFormElement): string[] {
  return [
    ...new Set(
      $$<HTMLInputElement>(form, 'input[name], textarea[name], select[name]')
        .filter((el) => !el.checkValidity())
        .map((el) => el.name),
    ),
  ];
}

interface FlowHooks {
  /** Return false to intercept (e.g. planner "Enter" on an early step). */
  beforeSubmit?: () => boolean;
  render: (ticket: string, data: Record<string, unknown>) => HTMLElement;
  onIdle?: () => void;
}

function wireSubmit(flow: HTMLElement, form: HTMLFormElement, hooks: FlowHooks) {
  const button = $<HTMLButtonElement>(form, '[data-submit]');
  const label = $(form, '[data-submit-label]');
  const error = $(form, '[data-error]');

  form.noValidate = true;
  form.addEventListener('focusin', () => armTurnstile(form), { once: true });
  form.addEventListener('pointerdown', () => armTurnstile(form), { once: true });
  form.addEventListener('input', (e) => (e.target as Element).removeAttribute('aria-invalid'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (hooks.beforeSubmit && !hooks.beforeSubmit()) return;
    if (form.getAttribute('aria-busy') === 'true') return;

    const bad = invalidFields(form);
    if (error) error.hidden = true;
    if (bad.length) {
      markInvalid(form, bad);
      if (error) {
        error.textContent = ERRORS['invalid'] ?? GENERIC_ERROR;
        error.hidden = false;
      }
      return;
    }

    const data = payload(form);
    form.setAttribute('aria-busy', 'true');
    if (button) button.disabled = true;
    if (label) label.textContent = 'Sending…';

    const result = await send(form);
    form.removeAttribute('aria-busy');
    if (label) label.textContent = label.dataset['idle'] ?? 'Send';

    if (result.ok) {
      const view = hooks.render(result.ticket, data);
      form.hidden = true;
      flow.append(view);
      $(view, '[role=status]')?.focus({ preventScroll: true });
      return;
    }
    if (button) button.disabled = false;
    hooks.onIdle?.();
    resetTurnstile(form);
    if (result.fields) markInvalid(form, result.fields);
    if (error) {
      error.textContent = result.message;
      error.hidden = false;
    }
  });
}

function fromTemplate(id: string): HTMLElement {
  const tpl = document.getElementById(id);
  const wrap = document.createElement('div');
  if (tpl instanceof HTMLTemplateElement) wrap.append(tpl.content.cloneNode(true));
  return wrap;
}

function fill(view: HTMLElement, slot: string, text: string) {
  const el = $(view, `[data-slot="${slot}"]`);
  if (el) el.textContent = text;
}

function genericSuccess(
  templateId: string,
  ticket: string,
  title: string,
  description: string,
  action?: { label: string; href: string },
) {
  const view = fromTemplate(templateId);
  fill(view, 'ticket', ticket);
  fill(view, 'title', title);
  fill(view, 'description', description);
  const link = $<HTMLAnchorElement>(view, '[data-slot="action"]');
  if (link && action) {
    link.href = action.href;
    link.hidden = false;
    fill(view, 'action-label', action.label);
  }
  return view;
}

/* ------------------------------------------------------- project planner */

function initPlanner(flow: HTMLElement, form: HTMLFormElement) {
  const count = Number(form.dataset['stepCount'] ?? 4);
  const panels = $$(form, '[data-step-panel]');
  const bars = $$(form, '[data-progress]');
  const stepLabel = $(form, '[data-step-label]');
  const back = $<HTMLButtonElement>(form, '[data-step-back]');
  const next = $<HTMLButtonElement>(form, '[data-step-next]');
  const submit = $<HTMLButtonElement>(form, '[data-submit]');
  let step = 1;

  const field = (name: string) => form.elements.namedItem(name);
  const checked = (name: string) => {
    const f = field(name);
    return f instanceof RadioNodeList ? f.value !== '' : false;
  };
  const valid = (n: number) => {
    if (n === 1) return checked('projectType');
    if (n === 3) return checked('timeline');
    if (n === 4) {
      const name = field('name');
      const email = field('email');
      return (
        name instanceof HTMLInputElement &&
        email instanceof HTMLInputElement &&
        name.value.trim() !== '' &&
        email.checkValidity() &&
        email.value !== ''
      );
    }
    return true;
  };

  const render = (focus = false) => {
    panels.forEach((p, i) => p.toggleAttribute('data-current', i + 1 === step));
    bars.forEach((b, i) => {
      b.classList.toggle('bg-foreground', i < step);
      b.classList.toggle('bg-muted', i >= step);
    });
    if (stepLabel) stepLabel.textContent = `Step ${step} of ${count}`;
    form.toggleAttribute('data-last-step', step === count);
    if (back) back.disabled = step === 1;
    if (next) {
      next.hidden = step === count;
      next.disabled = !valid(step);
    }
    if (submit && form.getAttribute('aria-busy') !== 'true') submit.disabled = !valid(count);
    if (focus) $(panels[step - 1] ?? form, 'h3')?.focus({ preventScroll: true });
  };

  back?.addEventListener('click', () => {
    if (step > 1) step--;
    render(true);
  });
  next?.addEventListener('click', () => {
    if (step < count && valid(step)) step++;
    render(true);
  });
  form.addEventListener('input', () => render());
  form.addEventListener('change', () => render());

  // Budget slider visuals.
  const budget = $(form, '[data-budget]');
  const range = $<HTMLInputElement>(form, 'input[type=range]');
  const value = $(form, '[data-budget-value]');
  const paint = () => {
    if (!range || !budget) return;
    const min = Number(range.min);
    const max = Number(range.max);
    const v = Number(range.value);
    budget.style.setProperty('--pct', `${((v - min) / (max - min)) * 100}%`);
    if (value) value.textContent = usd(v);
    range.setAttribute('aria-valuetext', usd(v));
  };
  range?.addEventListener('input', paint);
  paint();

  const qualifiedFrom = Number(flow.dataset['qualifiedFrom'] ?? 0);
  const bookingUrl = flow.dataset['bookingUrl'] ?? '';

  wireSubmit(flow, form, {
    beforeSubmit: () => {
      if (step < count) {
        if (valid(step)) {
          step++;
          render(true);
        }
        return false;
      }
      return true;
    },
    onIdle: () => render(),
    render: (ticket, data) =>
      Number(data['budget']) >= qualifiedFrom
        ? genericSuccess(
            'project-success',
            ticket,
            'Looks like a great fit',
            "Pick a time for an intro call and we'll come prepared.",
            {
              label: 'Book a call',
              href: bookingUrl,
            },
          )
        : genericSuccess(
            'project-success',
            ticket,
            "Thanks, we've got your details",
            "We'll email you some resources that fit your budget and timeline.",
          ),
  });
  render();
}

/* ------------------------------------------------------------ specialist */

function initSpecialist(flow: HTMLElement, form: HTMLFormElement) {
  const route = $(form, '[data-specialist-route]');
  const initial = $(form, '[data-specialist-initial]');
  const owner = $(form, '[data-specialist-owner]');
  const label = $(form, '[data-submit-label]');
  const submit = $<HTMLButtonElement>(form, '[data-submit]');
  const email = $<HTMLInputElement>(form, 'input[type=email]');

  const selected = () => $<HTMLInputElement>(form, 'input[name=service]:checked');
  const update = () => {
    const radio = selected();
    const lead = radio?.dataset['owner'];
    if (route) route.hidden = !lead;
    if (lead) {
      if (initial) initial.textContent = lead.charAt(0).toUpperCase();
      if (owner) owner.textContent = `the ${lead.toLowerCase()}`;
    }
    const idle = lead ? `Send to the ${lead.toLowerCase()}` : 'Send';
    if (label) {
      label.dataset['idle'] = idle;
      if (form.getAttribute('aria-busy') !== 'true') label.textContent = idle;
    }
    if (submit && form.getAttribute('aria-busy') !== 'true') {
      submit.disabled = !radio || !email || email.value === '' || !email.checkValidity();
    }
  };
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();

  wireSubmit(flow, form, {
    onIdle: update,
    render: (ticket, data) => {
      const radio = selected();
      const lead = (radio?.dataset['owner'] ?? 'Studio lead').toLowerCase();
      const role = radio?.dataset['role'] ?? '';
      return genericSuccess(
        'specialist-success',
        ticket,
        `Sent to the ${lead}`,
        `The ${lead}${role ? ` (${role})` : ''} will reply to ${String(data['email'] ?? '')} directly.`,
      );
    },
  });
}

/* ----------------------------------------------------------------- brief */

function initBrief(flow: HTMLElement, form: HTMLFormElement) {
  wireSubmit(flow, form, {
    render: (ticket, data) => {
      const view = fromTemplate('brief-success');
      const first =
        String(data['name'] ?? '')
          .trim()
          .split(/\s+/)[0] || 'there';
      fill(view, 'ticket', ticket);
      fill(view, 'title', `Thanks, ${first}. Here's what happens next`);
      return view;
    },
  });
}

/* ------------------------------------------------------------------ init */

export function initContact() {
  const now = String(Date.now());
  for (const el of $$<HTMLInputElement>(document, '[data-contact-time]')) el.value = now;

  const root = $(document, '[data-contact-root]');
  if (root) initTabs(root);

  for (const flow of $$(document, '[data-contact-flow]')) {
    const form = $<HTMLFormElement>(flow, 'form[data-contact-form]');
    if (!form) continue;
    const kind = flow.dataset['contactFlow'];
    if (kind === 'project') initPlanner(flow, form);
    else if (kind === 'specialist') initSpecialist(flow, form);
    else initBrief(flow, form);
  }
}
