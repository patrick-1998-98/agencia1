/**
 * Markup for the admin demo. Every function returns escaped HTML so the
 * Astro pages can render the initial board on the server and the client
 * controllers can re-render the same markup after each change.
 */
import {
  automations,
  setupColumns,
  team,
  ticketColumns,
  toolLogos,
  type Automation,
  type BoardColumn,
} from '@/data/admin/config';
import { cx, html, type SafeHtml } from './html';
import { icon } from './icons';
import {
  automationBySlug,
  lastSevenDays,
  openCounts,
  relativeTime,
  setupCodes,
  submissionRows,
  summarize,
  timestamp,
  weekTotal,
  type AdminState,
  type Stat,
  type Ticket,
  type TicketFilters,
} from './model';

export const NOTE_TEXT = 'Vista previa con datos de ejemplo. Nada de lo que cambies se guarda.';
export const DND_HINT_ID = 'admin-dnd-hint';

/* ---- Small pieces ----------------------------------------------------- */

const chip = (label: string, tone: string) =>
  html`<span class="${cx('admin-chip', `admin-chip--${tone}`)}">${label}</span>`;

const avatar = (name: string) =>
  html`<span class="admin-avatar" aria-hidden="true">${name.charAt(0)}</span>`;

export interface SelectOption {
  value: string;
  label: string;
}

export function select(opts: {
  label: string;
  name: string;
  value: string;
  options: SelectOption[];
  small?: boolean;
  id?: string;
}): SafeHtml {
  const current = opts.options.find((o) => o.value === opts.value) ?? opts.options[0];
  return html`<span class="${cx('admin-select', opts.small && 'admin-select--sm')}">
    <span class="admin-select-value" aria-hidden="true">${current?.label ?? ''}</span>
    ${icon('angle-down', 'admin-select-chevron')}
    <select name="${opts.name}" aria-label="${opts.label}" ${opts.id ? html`id="${opts.id}"` : ''}>
      ${opts.options.map(
        (o) =>
          html`<option value="${o.value}" ${o.value === opts.value ? 'selected' : ''}>
            ${o.label}
          </option>`,
      )}
    </select>
  </span>`;
}

export const searchField = (label: string, placeholder: string, value: string, wide = true) =>
  html`<label class="${cx('admin-search', !wide && 'admin-search--narrow')}">
    ${icon('search', 'admin-search-icon')}
    <input
      type="search"
      name="q"
      aria-label="${label}"
      placeholder="${placeholder}"
      value="${value}"
      autocomplete="off"
      spellcheck="false"
    />
  </label>`;

/* ---- Sidebar ---------------------------------------------------------- */

export type AdminSection = 'tickets' | 'setup';

export function navItems(active: AdminSection, filter: string, counts: Record<string, number>) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const item = (href: string, label: SafeHtml, current: boolean, count?: number, slug?: string) =>
    html`<a
      href="${href}"
      class="admin-nav-item"
      ${current ? html`aria-current="page"` : ''}
      ${slug ? html`data-automation="${slug}"` : ''}
      >${label}${count === undefined ? '' : html`<span class="admin-count">${count}</span>`}</a
    >`;

  return html`<p class="admin-nav-label">Tickets</p>
    ${item(
      '/admin/automations',
      html`${icon('ticket-perforated')}<span>Todos los tickets</span>`,
      active === 'tickets' && filter === 'all',
      total,
      'all',
    )}
    ${automations.map((a) =>
      item(
        `/admin/automations?automation=${a.slug}`,
        html`<span class="admin-truncate">${a.title}</span>`,
        active === 'tickets' && filter === a.slug,
        counts[a.slug] ?? 0,
        a.slug,
      ),
    )}
    <p class="admin-nav-label admin-nav-label--gap">Tipos de solicitud</p>
    ${item(
      '/admin/automations/setup',
      html`${icon('layout1')}<span>Tablero de configuración</span>`,
      active === 'setup',
    )}`;
}

/* ---- Stats ------------------------------------------------------------ */

export const stats = (items: Stat[]) =>
  html`${items.map(
    (s) =>
      html`<section class="admin-stat">
        <span class="admin-stat-icon">${icon(s.icon)}</span>
        <div class="admin-stat-text">
          <p class="admin-stat-label">${s.label}</p>
          <div class="admin-stat-row">
            <p class="admin-stat-value">${s.value}</p>
            ${chip(s.delta, s.tone)}
          </div>
        </div>
      </section>`,
  )}`;

/* ---- Columns ---------------------------------------------------------- */

function column<Id extends string>(
  col: BoardColumn<Id>,
  count: number,
  body: SafeHtml,
  wide: boolean,
): SafeHtml {
  return html`<section
    class="${cx('admin-column', !wide && 'admin-column--narrow')}"
    data-column="${col.id}"
    aria-labelledby="admin-col-${col.id}"
  >
    <header class="admin-column-head">
      <span class="${cx('admin-dot', `admin-dot--${col.dot}`)}" aria-hidden="true"></span>
      <h2 class="admin-column-title" id="admin-col-${col.id}">${col.label}</h2>
      <span class="admin-count" aria-label="${count} ${count === 1 ? 'elemento' : 'elementos'}"
        >${count}</span
      >
      ${icon(col.icon, 'admin-icon admin-column-icon')}
    </header>
    <ul class="admin-list" role="list">
      ${body}
    </ul>
  </section>`;
}

const empty = (text: string) => html`<li class="admin-empty">${text}</li>`;

/* ---- Tickets board ---------------------------------------------------- */

export function ticketCard(t: Ticket, now: number): SafeHtml {
  const s = summarize(t.slug, t.data);
  const type = automationBySlug[t.slug]?.title ?? t.slug;
  return html`<li>
    <button
      type="button"
      class="admin-card"
      data-id="${t.id}"
      aria-describedby="${DND_HINT_ID}"
      aria-label="${t.key}: ${s.title}. ${type}."
    >
      <span class="admin-card-top"
        ><span class="admin-key">${t.key}</span><span class="admin-tag">${type}</span></span
      >
      <span class="admin-card-title">${s.title}</span>
      ${s.detail ? html`<span class="admin-card-detail">${s.detail}</span>` : ''}
      ${s.body ? html`<span class="admin-card-body">${s.body}</span>` : ''}
      <span class="admin-card-foot">
        <span class="admin-card-meta">
          ${s.chip ? chip(s.chip.label, s.chip.tone) : ''}
          ${
            t.assignee
              ? html`<span class="admin-assignee">${avatar(t.assignee)}${t.assignee}</span>`
              : html`<span class="admin-faint">Sin asignar</span>`
          }
        </span>
        <span class="admin-faint" data-time="${t.createdAt}"
          >${relativeTime(t.createdAt, now)}</span
        >
      </span>
    </button>
  </li>`;
}

export function ticketBoard(tickets: Ticket[], total: number, now: number): SafeHtml {
  return html`${ticketColumns.map((col) => {
    const list = tickets.filter((t) => t.status === col.id);
    const body = list.length
      ? html`${list.map((t) => ticketCard(t, now))}`
      : empty(
          col.id === 'new' && total === 0
            ? 'Todavía no hay tickets. Cada envío desde el sitio abre uno acá.'
            : 'Arrastrá un ticket acá',
        );
    return column(col, list.length, body, true);
  })}`;
}

export const automationOptions: SelectOption[] = [
  { value: 'all', label: 'Todos los tipos' },
  ...automations.map((a) => ({ value: a.slug, label: a.title })),
];

export const assigneeOptions: SelectOption[] = [
  { value: 'anyone', label: 'Cualquiera' },
  { value: 'none', label: 'Sin asignar' },
  ...team.map((m) => ({ value: m.name, label: m.name })),
];

export function ticketToolbar(f: TicketFilters): SafeHtml {
  const filtered = f.automation !== 'all' || f.assignee !== 'anyone' || f.query.trim() !== '';
  return html`${searchField('Buscar tickets', 'Buscá tickets, nombres, emails…', f.query)}
    ${select({ label: 'Tipo de solicitud', name: 'automation', value: f.automation, options: automationOptions })}
    ${select({ label: 'Responsable', name: 'assignee', value: f.assignee, options: assigneeOptions })}
    <button
      type="button"
      class="admin-ghost"
      data-action="clear-filters"
      ${filtered ? '' : 'hidden'}
    >
      Limpiar filtros
    </button>`;
}

/* ---- Setup board ------------------------------------------------------ */

function logos(stack: Automation['stack']) {
  return html`<span class="admin-logos"
    >${stack.map(
      (tool) =>
        html`<img
          class="${cx('admin-logo', tool !== 'Supabase' && 'admin-logo--invert')}"
          src="${toolLogos[tool]}"
          alt="${tool}"
          width="20"
          height="20"
          loading="lazy"
          decoding="async"
        />`,
    )}</span
  >`;
}

export function setupCard(a: Automation, state: AdminState, now: number): SafeHtml {
  const open = openCounts(state.tickets)[a.slug] ?? 0;
  const week = weekTotal(state.daily[a.slug], now);
  const updated = state.board[a.slug]?.updatedAt ?? null;
  return html`<li>
    <button
      type="button"
      class="admin-card admin-card--setup"
      data-slug="${a.slug}"
      aria-describedby="${DND_HINT_ID}"
      aria-label="${setupCodes[a.slug]}: ${a.title}."
    >
      <span class="admin-card-top"
        ><span class="admin-code">${setupCodes[a.slug]}</span
        ><span class="admin-tag">${a.tag}</span></span
      >
      <span class="admin-card-title">${a.title}</span>
      <span class="admin-card-summary">${a.summary}</span>
      <span class="admin-card-stackrow"
        >${logos(a.stack)}${
          updated
            ? html`<span class="admin-faint" data-time="${updated}" data-prefix="Actualizado "
                >Actualizado ${relativeTime(updated, now)}</span
              >`
            : ''
        }</span
      >
      <span class="admin-card-stats"
        ><span><b>${open}</b> ${open === 1 ? 'ticket abierto' : 'tickets abiertos'}</span
        ><span>${week} esta semana</span></span
      >
    </button>
  </li>`;
}

export function setupBoard(list: Automation[], state: AdminState, now: number): SafeHtml {
  return html`${setupColumns.map((col) => {
    const items = list.filter((a) => (state.board[a.slug]?.stage ?? 'backlog') === col.id);
    const body = items.length
      ? html`${items.map((a) => setupCard(a, state, now))}`
      : empty('Arrastrá un tipo de solicitud acá');
    return column(col, items.length, body, false);
  })}`;
}

export const setupSortOptions: SelectOption[] = [
  { value: 'board', label: 'Orden del tablero' },
  { value: 'name', label: 'Nombre A–Z' },
  { value: 'recent', label: 'Más recientes' },
  { value: 'open', label: 'Más tickets abiertos' },
];

export const setupToolbar = (query: string, sort: string) =>
  html`${searchField('Buscar tipos de solicitud', 'Buscar tipos de solicitud', query, false)}
    ${select({ label: 'Ordenar', name: 'sort', value: sort, options: setupSortOptions })}
    <button type="button" class="admin-ghost admin-ghost--end" data-action="reset-board">
      ${icon('arrows-rotate', 'admin-icon admin-icon--lg')}Restablecer tablero
    </button>`;

/* ---- Panels ----------------------------------------------------------- */

const panelShell = (
  label: string,
  head: SafeHtml,
  body: SafeHtml,
  foot: SafeHtml,
  closeLabel: string,
) =>
  html`<div class="admin-backdrop" data-action="close-panel" aria-hidden="true"></div>
    <aside class="admin-panel" role="dialog" aria-modal="true" aria-label="${label}" tabindex="-1">
      <div class="admin-panel-head">
        <span class="admin-panel-ident">${head}</span>
        <button
          type="button"
          class="admin-icon-btn"
          data-action="close-panel"
          aria-label="${closeLabel}"
        >
          ${icon('close')}
        </button>
      </div>
      <div class="admin-panel-body">${body}</div>
      <div class="admin-panel-foot">${foot}</div>
    </aside>`;

const sectionTitle = (name: string, label: string) =>
  html`<h3 class="admin-section-title">${icon(name, 'admin-icon admin-icon--muted')} ${label}</h3>`;

const statusOptions = ticketColumns.map((c) => ({ value: c.id, label: c.label }));
const stageOptions = setupColumns.map((c) => ({ value: c.id, label: c.label }));

export function ticketPanel(t: Ticket, now: number, confirming = false): SafeHtml {
  const s = summarize(t.slug, t.data);
  const type = automationBySlug[t.slug]?.title ?? t.slug;
  const email = typeof t.data['email'] === 'string' ? t.data['email'] : null;
  const body = html`<div>
      <h2 class="admin-panel-title">${s.title}</h2>
      <p class="admin-panel-sub">
        Abierto <span data-time="${t.createdAt}">${relativeTime(t.createdAt, now)}</span> ·
        ${timestamp(t.createdAt)}
      </p>
      ${t.stageAtCreation === 'paused' ? html`<p class="admin-panel-warn">Llegó mientras este tipo de solicitud estaba pausado.</p>` : ''}
    </div>
    <dl class="admin-fields">
      <dt>Estado</dt>
      <dd>
        ${select({ label: 'Estado', name: 'status', value: t.status, options: statusOptions, small: true, id: 'admin-panel-status' })}
      </dd>
      <dt>Responsable</dt>
      <dd>
        ${select({
          label: 'Responsable',
          name: 'assignee',
          value: t.assignee ?? 'none',
          options: assigneeOptions.slice(1),
          small: true,
          id: 'admin-panel-assignee',
        })}
      </dd>
      <dt>Tipo de solicitud</dt>
      <dd>${type}</dd>
    </dl>
    ${
      email
        ? html`<a
            class="admin-button"
            href="mailto:${email}?subject=${encodeURIComponent(`Re: tu consulta [${t.key}]`)}"
            >${icon('envelope')}Responder por email</a
          >`
        : ''
    }
    <section class="admin-section">
      ${sectionTitle('file-text', 'Envío')}
      <dl class="admin-rows">
        ${submissionRows(t.data).map(
          ([label, value]) =>
            html`<div>
              <dt>${label}</dt>
              <dd>${value}</dd>
            </div>`,
        )}
      </dl>
    </section>
    <section class="admin-section">
      ${sectionTitle('time-history', 'Actividad')}
      <ol class="admin-activity">
        ${t.activity.map((a) =>
          a.type === 'note'
            ? html`<li class="admin-activity-note">
                <p class="admin-activity-meta">
                  ${icon('chat', 'admin-icon admin-icon--xs')} Nota ·
                  <span data-time="${a.at}">${relativeTime(a.at, now)}</span>
                </p>
                <p>${a.text}</p>
              </li>`
            : html`<li class="admin-activity-event">
                <span>${a.text}</span
                ><span class="admin-faint" data-time="${a.at}">${relativeTime(a.at, now)}</span>
              </li>`,
        )}
      </ol>
      <form class="admin-note-form" data-form="note">
        <label class="sr-only" for="admin-note-input">Agregar una nota</label>
        <textarea
          id="admin-note-input"
          name="note"
          rows="2"
          placeholder="Agregá una nota…"
          maxlength="2000"
        ></textarea>
        <button type="submit" class="admin-button">Agregar nota</button>
      </form>
    </section>`;
  const foot = confirming
    ? html`<p class="admin-confirm" role="alert">¿Eliminar ${t.key} para siempre?</p>
        <span class="admin-actions">
          <button type="button" class="admin-button" data-action="cancel-delete">Cancelar</button>
          <button
            type="button"
            class="admin-button admin-button--danger"
            data-action="confirm-delete"
          >
            Eliminar ticket
          </button>
        </span>`
    : html`<span class="admin-faint"
          >Actualizado
          <span data-time="${t.updatedAt}">${relativeTime(t.updatedAt, now)}</span></span
        >
        <button type="button" class="admin-button admin-button--ghost-danger" data-action="delete">
          ${icon('trash')}Eliminar
        </button>`;
  return panelShell(
    `Ticket ${t.key}`,
    html`<span class="admin-key admin-key--mono">${t.key}</span
      ><span class="admin-tag">${type}</span>`,
    body,
    foot,
    'Cerrar ticket',
  );
}

function weekChart(daily: Record<string, number> | undefined, now: number): SafeHtml {
  const days = lastSevenDays(daily, now);
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const weekday = (key: string) =>
    new Date(`${key}T12:00:00Z`).toLocaleDateString('es-AR', {
      weekday: 'narrow',
      timeZone: 'UTC',
    });
  return html`<figure class="admin-chart">
    <div class="admin-chart-bars" aria-hidden="true">
      ${days.map(
        (d) =>
          html`<span class="admin-chart-col"
            ><span
              class="${cx('admin-chart-bar', !d.count && 'admin-chart-bar--empty')}"
              style="height:${d.count ? Math.max(8, Math.round((d.count / max) * 52)) : 4}px"
              title="${d.key}: ${d.count}"
            ></span
            ><span class="admin-chart-day">${weekday(d.key)}</span></span
          >`,
      )}
    </div>
    <figcaption class="admin-faint">
      ${total} ${total === 1 ? 'ticket abierto' : 'tickets abiertos'} en los últimos 7 días (UTC).
    </figcaption>
  </figure>`;
}

export function setupPanel(
  a: Automation,
  state: AdminState,
  now: number,
  draft: Record<string, string>,
): SafeHtml {
  const board = state.board[a.slug];
  const open = openCounts(state.tickets)[a.slug] ?? 0;
  const dirty = JSON.stringify(draft) !== JSON.stringify(board?.settings ?? {});
  const body = html`<div>
      <h2 class="admin-panel-title">${a.title}</h2>
      <p class="admin-panel-lede">${a.summary}</p>
    </div>
    <dl class="admin-fields">
      <dt>Etapa</dt>
      <dd>
        ${select({ label: 'Etapa', name: 'stage', value: board?.stage ?? 'backlog', options: stageOptions, small: true, id: 'admin-panel-stage' })}
      </dd>
      <dt>Componente</dt>
      <dd class="admin-mono">&lt;${a.component} /&gt;</dd>
      <dt>Envía a</dt>
      <dd class="admin-mono">POST /api/automations/${a.slug}</dd>
      <dt>Se ejecuta</dt>
      <dd>${a.trigger}</dd>
      <dt>Dónde va</dt>
      <dd>${a.placement}</dd>
      <dt>Herramientas</dt>
      <dd class="admin-tools">
        ${logos(a.stack)}<span class="admin-faint">${a.stack.join(', ')}</span>
      </dd>
    </dl>
    <section class="admin-section">
      ${sectionTitle('chart-square', 'Tickets · últimos 7 días')}
      ${weekChart(state.daily[a.slug], now)}
      <div class="admin-open-row">
        <span><b>${open}</b> ${open === 1 ? 'ticket abierto' : 'tickets abiertos'}</span>
        <a class="admin-button" href="/admin/automations?automation=${a.slug}"
          >${icon('ticket-perforated')}Ver tickets</a
        >
      </div>
    </section>
    <section class="admin-section">
      ${sectionTitle('wrench', 'Ajustes')}
      <form class="admin-settings" data-form="settings">
        ${a.settings.map(
          (label, i) =>
            html`<label class="admin-input">
              <span>${label}</span>
              <input
                id="admin-setting-${i}"
                name="setting-${i}"
                data-setting="${label}"
                value="${draft[label] ?? ''}"
                placeholder="Sin definir"
                autocomplete="off"
              />
            </label>`,
        )}
        <span class="admin-actions">
          <button
            type="submit"
            class="admin-button admin-button--primary"
            ${dirty ? '' : 'disabled'}
          >
            Guardar cambios
          </button>
          ${dirty ? html`<button type="button" class="admin-button" data-action="discard">Descartar</button>` : ''}
        </span>
      </form>
    </section>
    <section class="admin-section">
      ${sectionTitle('chat', 'Notas')}
      ${
        board?.notes.length
          ? html`<ol class="admin-activity">
              ${board.notes.map(
                (n) =>
                  html`<li class="admin-activity-note">
                    <p class="admin-activity-meta">
                      <span data-time="${n.at}">${relativeTime(n.at, now)}</span>
                    </p>
                    <p>${n.text}</p>
                  </li>`,
              )}
            </ol>`
          : ''
      }
      <form class="admin-note-form" data-form="note">
        <label class="sr-only" for="admin-note-input">Agregar una nota</label>
        <textarea
          id="admin-note-input"
          name="note"
          rows="2"
          placeholder="Agregá una nota…"
          maxlength="2000"
        ></textarea>
        <button type="submit" class="admin-button">Agregar nota</button>
      </form>
    </section>`;
  const foot = html`<span class="admin-faint"
      >${
        board?.updatedAt
          ? html`Actualizado
              <span data-time="${board.updatedAt}">${relativeTime(board.updatedAt, now)}</span>`
          : 'Sin cambios todavía'
      }</span
    >
    <a
      class="admin-button"
      href="https://flux-theme.online/automations/${a.slug}"
      target="_blank"
      rel="noopener noreferrer"
      >${icon('arrow-up-right')}Ver en vivo</a
    >`;
  return panelShell(
    a.title,
    html`<span class="admin-key admin-key--mono">${setupCodes[a.slug]}</span
      ><span class="admin-tag">${a.tag}</span>`,
    body,
    foot,
    'Cerrar panel',
  );
}
