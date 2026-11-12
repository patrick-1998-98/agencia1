/**
 * Admin demo data model: types, sample-data loading and the pure helpers
 * shared by server rendering (Astro) and the client controllers.
 */
import sample from '@/data/admin/sample.json';
import {
  automations,
  categoryCodes,
  type Automation,
  type SetupStage,
  type TicketStatus,
} from '@/data/admin/config';

export interface ActivityEntry {
  at: string;
  type: 'event' | 'note';
  text: string;
}

export type SubmissionValue = string | number | boolean | string[];

export interface Ticket {
  id: string;
  key: string;
  slug: string;
  status: TicketStatus;
  assignee: string | null;
  stageAtCreation: string;
  data: Record<string, SubmissionValue>;
  createdAt: string;
  updatedAt: string;
  activity: ActivityEntry[];
}

export interface SetupState {
  stage: SetupStage;
  settings: Record<string, string>;
  notes: { text: string; at: string }[];
  updatedAt: string | null;
}

export interface AdminState {
  board: Record<string, SetupState>;
  tickets: Ticket[];
  /** Tickets opened per request type per UTC day (YYYY-MM-DD). */
  daily: Record<string, Record<string, number>>;
}

const DAY_MS = 864e5;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/**
 * The sample was captured at `generatedAt`. Shift every timestamp (and the
 * daily buckets) so the data always looks fresh relative to `now`.
 */
export function loadSample(now = Date.now()): AdminState {
  const { generatedAt, ...rest } = sample as unknown as AdminState & { generatedAt: string };
  const offset = now - Date.parse(generatedAt);

  const shift = (value: unknown): unknown => {
    if (typeof value === 'string' && ISO_RE.test(value)) {
      return new Date(Date.parse(value) + offset).toISOString();
    }
    if (Array.isArray(value)) return value.map(shift);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shift(v)]));
    }
    return value;
  };

  const daily = Object.fromEntries(
    Object.entries(rest.daily).map(([slug, days]) => [
      slug,
      Object.fromEntries(
        Object.entries(days).map(([day, count]) => [
          isoDay(Date.parse(`${day}T12:00:00Z`) + offset),
          count,
        ]),
      ),
    ]),
  );

  return {
    ...(shift({ board: rest.board, tickets: rest.tickets }) as Omit<AdminState, 'daily'>),
    daily,
  };
}

export const automationBySlug: Record<string, Automation> = Object.fromEntries(
  automations.map((a) => [a.slug, a]),
);

/** AG-1, AG-2… in board order. */
export const setupCodes: Record<string, string> = (() => {
  const seen: Record<string, number> = {};
  return Object.fromEntries(
    automations.map((a) => {
      seen[a.category] = (seen[a.category] ?? 0) + 1;
      return [a.slug, `${categoryCodes[a.category]}-${seen[a.category]}`];
    }),
  );
})();

/* ---- Formatting ------------------------------------------------------- */

export function relativeTime(iso: string | null, now = Date.now()): string | null {
  if (!iso) return null;
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'recién';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  return new Date(iso).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
}

export const timestamp = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const money = (n: SubmissionValue | undefined) => `US$ ${Number(n).toLocaleString('es-AR')}`;

export type ChipTone = 'lime' | 'rose' | 'neutral';

export interface TicketSummary {
  title: string;
  detail?: string;
  body?: string;
  chip?: { label: string; tone: ChipTone };
}

/** How each request type's submission reads on a card / panel. */
export function summarize(slug: string, data: Record<string, SubmissionValue>): TicketSummary {
  const s = (key: string) => (data[key] === undefined ? '' : String(data[key]));
  switch (slug) {
    case 'lead-qualification':
      return {
        title: `${s('name')} · ${s('email')}`,
        detail: `${s('projectType')} · ${money(data['budget'])} · ${s('timeline')}`,
        body: s('goals'),
        chip: data['qualified']
          ? { label: 'Calificado', tone: 'lime' }
          : { label: 'Bajo presupuesto', tone: 'neutral' },
      };
    case 'lead-routing':
      return { title: s('email'), detail: `${s('service')} → ${s('owner')}, ${s('role')}` };
    case 'instant-enquiry-replies':
      return {
        title: `${s('name')} · ${s('email')}`,
        detail:
          [
            s('company'),
            Array.isArray(data['services']) ? data['services'].join(', ') : '',
            s('budget'),
          ]
            .filter(Boolean)
            .join(' · ') || 'Consulta general',
        body: s('message'),
      };
    case 'client-onboarding': {
      const { clientName, ...answers } = data;
      return {
        title: clientName ? `${String(clientName)} · onboarding` : 'Cuestionario de onboarding',
        detail: `${Object.keys(answers).length} respuestas`,
        body: Object.values(answers).map(String).join(' · '),
      };
    }
    case 'follow-up-reminders': {
      const score = Number(data['score']);
      return {
        title: `Feedback · ${score}/5`,
        detail: data['reviewAsked'] ? 'Se pidió una reseña pública' : 'Hacer seguimiento personal',
        body: s('comment'),
        chip: {
          label: `${score}/5`,
          tone: score >= 4 ? 'lime' : score <= 2 ? 'rose' : 'neutral',
        },
      };
    }
    default:
      return { title: 'Envío', body: Object.values(data).map(String).join(' · ') };
  }
}

const FIELD_LABELS: Record<string, string> = {
  projectType: 'Tipo de proyecto',
  clientName: 'Cliente',
  reviewAsked: 'Reseña pedida',
  name: 'Nombre',
  email: 'Email',
  company: 'Empresa',
  message: 'Mensaje',
  services: 'Servicios',
  budget: 'Presupuesto',
  timeline: 'Plazo',
  goals: 'Objetivos',
  qualified: 'Calificado',
  service: 'Servicio',
  owner: 'Responsable',
  role: 'Rol',
  brand: 'Marca',
  audience: 'Público',
  assets: 'Archivos',
  score: 'Puntaje',
  comment: 'Comentario',
};

/** Submission as label/value rows for the ticket panel. */
export function submissionRows(data: Record<string, SubmissionValue>): [string, string][] {
  return Object.entries(data).map(([key, value]) => {
    const label =
      FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
    const text =
      typeof value === 'boolean'
        ? value
          ? 'Sí'
          : 'No'
        : Array.isArray(value)
          ? value.join(', ')
          : key === 'budget' && typeof value === 'number'
            ? money(value)
            : key === 'score'
              ? `${value}/5`
              : String(value);
    return [label, text];
  });
}

/* ---- Aggregates ------------------------------------------------------- */

/** Open (not done) tickets per request type. */
export const openCounts = (tickets: Ticket[]): Record<string, number> =>
  tickets.reduce<Record<string, number>>((acc, t) => {
    if (t.status !== 'done') acc[t.slug] = (acc[t.slug] ?? 0) + 1;
    return acc;
  }, {});

/** Last 7 UTC days, oldest first. */
export function lastSevenDays(daily: Record<string, number> = {}, now = Date.now()) {
  return Array.from({ length: 7 }, (_, i) => {
    const key = isoDay(now - (6 - i) * DAY_MS);
    return { key, count: daily[key] ?? 0 };
  });
}

export const weekTotal = (daily: Record<string, number> | undefined, now = Date.now()) =>
  lastSevenDays(daily, now).reduce((sum, d) => sum + d.count, 0);

export interface Stat {
  icon: string;
  label: string;
  value: string;
  delta: string;
  tone: ChipTone;
}

export function ticketStats(tickets: Ticket[], now = Date.now()): Stat[] {
  const count = (status: TicketStatus) => tickets.filter((t) => t.status === status).length;
  const today = new Date(now).toDateString();
  const createdToday = tickets.filter((t) => new Date(t.createdAt).toDateString() === today).length;
  const weekAgo = new Date(now - 7 * DAY_MS).toISOString();
  const doneRecently = tickets.filter((t) => t.status === 'done' && t.updatedAt >= weekAgo).length;
  return [
    {
      icon: 'inbox',
      label: 'Nuevos',
      value: String(count('new')),
      delta: `+${createdToday} hoy`,
      tone: createdToday ? 'lime' : 'neutral',
    },
    {
      icon: 'hourglass-half',
      label: 'En curso',
      value: String(count('in_progress')),
      delta: 'abiertos',
      tone: 'neutral',
    },
    {
      icon: 'clock',
      label: 'En espera',
      value: String(count('waiting')),
      delta: 'del cliente',
      tone: 'neutral',
    },
    {
      icon: 'check-circle',
      label: 'Listos',
      value: String(doneRecently),
      delta: 'últimos 7 días',
      tone: 'neutral',
    },
  ];
}

export function setupStats(board: Record<string, SetupState>): Stat[] {
  const total = automations.length;
  const count = (stage: SetupStage) =>
    automations.filter((a) => board[a.slug]?.stage === stage).length;
  const paused = count('paused');
  return [
    {
      icon: 'play-circle',
      label: 'Activos',
      value: String(count('live')),
      delta: `de ${total}`,
      tone: 'lime',
    },
    {
      icon: 'flask',
      label: 'En prueba',
      value: String(count('testing')),
      delta: `de ${total}`,
      tone: 'neutral',
    },
    {
      icon: 'wrench',
      label: 'Configurando',
      value: String(count('setup')),
      delta: `de ${total}`,
      tone: 'neutral',
    },
    {
      icon: 'pause-circle',
      label: 'Pausados',
      value: String(paused),
      delta: `de ${total}`,
      tone: paused ? 'rose' : 'neutral',
    },
  ];
}

/* ---- Filters ---------------------------------------------------------- */

export interface TicketFilters {
  automation: string; // 'all' | slug
  assignee: string; // 'anyone' | 'none' | team member name
  query: string;
}

export function filterTickets(tickets: Ticket[], f: TicketFilters): Ticket[] {
  const q = f.query.trim().toLowerCase();
  return tickets
    .filter((t) => f.automation === 'all' || t.slug === f.automation)
    .filter((t) =>
      f.assignee === 'anyone'
        ? true
        : f.assignee === 'none'
          ? !t.assignee
          : t.assignee === f.assignee,
    )
    .filter((t) => !q || `${t.key} ${Object.values(t.data).join(' ')}`.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type SetupSort = 'board' | 'name' | 'recent' | 'open';

export function sortAutomations(state: AdminState, query: string, sort: SetupSort): Automation[] {
  const q = query.trim().toLowerCase();
  const open = openCounts(state.tickets);
  return automations
    .filter((a) => !q || `${a.title} ${a.summary} ${a.component}`.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title);
      if (sort === 'recent')
        return (state.board[b.slug]?.updatedAt ?? '').localeCompare(
          state.board[a.slug]?.updatedAt ?? '',
        );
      if (sort === 'open') return (open[b.slug] ?? 0) - (open[a.slug] ?? 0);
      return 0;
    });
}
