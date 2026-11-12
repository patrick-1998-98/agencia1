/**
 * Tickets board controller (/admin, /admin/automations). The board is first
 * rendered on the server; this takes over with the visitor's in-memory state.
 */
import { ticketColumns, type TicketStatus } from '@/data/admin/config';
import {
  automationBySlug,
  filterTickets,
  openCounts,
  ticketStats,
  type AdminState,
  type Ticket,
  type TicketFilters,
} from './model';
import { getState, subscribe, update } from './store';
import { navItems, stats, ticketBoard, ticketPanel } from './templates';
import { announce, createPanel, initBoardDnd, refreshTimes, syncSelect, toast } from './ui';

const statusLabel = (s: string) => ticketColumns.find((c) => c.id === s)?.label ?? s;
const columnIds = ticketColumns.map((c) => c.id);

export function initTickets(app: HTMLElement) {
  const statsEl = app.querySelector<HTMLElement>('[data-region="stats"]');
  const boardEl = app.querySelector<HTMLElement>('[data-region="board"]');
  const toolbar = app.querySelector<HTMLElement>('[data-region="toolbar"]');
  const panelRoot = document.getElementById('admin-panel-root');
  const nav = document.querySelector<HTMLElement>('.admin-nav');
  if (!statsEl || !boardEl || !toolbar || !panelRoot) return;

  const params = new URLSearchParams(location.search);
  const requested = params.get('automation') ?? 'all';
  const filters: TicketFilters = {
    automation: requested in automationBySlug ? requested : 'all',
    assignee: 'anyone',
    query: '',
  };
  let openId: string | null = null;
  let confirming = false;

  const search = toolbar.querySelector<HTMLInputElement>('input[name="q"]');
  const typeSelect = toolbar.querySelector<HTMLSelectElement>('select[name="automation"]');
  const assigneeSelect = toolbar.querySelector<HTMLSelectElement>('select[name="assignee"]');
  const clear = toolbar.querySelector<HTMLButtonElement>('[data-action="clear-filters"]');

  const panel = createPanel(panelRoot, () => {
    openId = null;
    confirming = false;
    syncUrl();
  });

  function syncUrl() {
    const url = new URL(location.href);
    if (filters.automation === 'all') url.searchParams.delete('automation');
    else url.searchParams.set('automation', filters.automation);
    if (openId) {
      const t = getState().tickets.find((x) => x.id === openId);
      if (t) url.searchParams.set('ticket', t.key);
    } else url.searchParams.delete('ticket');
    history.replaceState(history.state, '', url);
  }

  function renderToolbar() {
    if (typeSelect) {
      typeSelect.value = filters.automation;
      syncSelect(typeSelect);
    }
    if (assigneeSelect) {
      assigneeSelect.value = filters.assignee;
      syncSelect(assigneeSelect);
    }
    if (search && search.value !== filters.query) search.value = filters.query;
    if (clear)
      clear.hidden =
        filters.automation === 'all' && filters.assignee === 'anyone' && !filters.query.trim();
  }

  function render(state: AdminState, focusId?: string) {
    const now = Date.now();
    const scroll = boardEl!.scrollLeft;
    const lists = [...boardEl!.querySelectorAll('.admin-list')].map((l) => l.scrollTop);
    statsEl!.innerHTML = stats(ticketStats(state.tickets, now)).value;
    boardEl!.innerHTML = ticketBoard(
      filterTickets(state.tickets, filters),
      state.tickets.length,
      now,
    ).value;
    boardEl!.scrollLeft = scroll;
    boardEl!.querySelectorAll('.admin-list').forEach((l, i) => (l.scrollTop = lists[i] ?? 0));
    if (nav)
      nav.innerHTML = navItems('tickets', filters.automation, openCounts(state.tickets)).value;
    renderToolbar();
    if (focusId) boardEl!.querySelector<HTMLElement>(`[data-id="${CSS.escape(focusId)}"]`)?.focus();
    const ticket = openId ? state.tickets.find((t) => t.id === openId) : undefined;
    if (ticket) panel.render(ticketPanel(ticket, now, confirming).value);
    else if (panel.isOpen) panel.close();
  }

  /* ---- Mutations ---- */

  const touch = (t: Ticket, text: string, patch: Partial<Ticket>): Ticket => {
    const at = new Date().toISOString();
    return {
      ...t,
      ...patch,
      updatedAt: at,
      activity: [...t.activity, { at, type: 'event', text }],
    };
  };

  function setStatus(id: string, status: TicketStatus, focus = false) {
    const t = getState().tickets.find((x) => x.id === id);
    if (!t || t.status === status) return;
    const text = `Movido de ${statusLabel(t.status)} a ${statusLabel(status)}`;
    update((s) => ({
      ...s,
      tickets: s.tickets.map((x) => (x.id === id ? touch(x, text, { status }) : x)),
    }));
    if (focus) boardEl!.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus();
    announce(`${t.key} movido a ${statusLabel(status)}.`);
  }

  function setAssignee(id: string, assignee: string | null) {
    const t = getState().tickets.find((x) => x.id === id);
    if (!t || t.assignee === assignee) return;
    const text = assignee ? `Asignado a ${assignee}` : 'Sin asignar';
    update((s) => ({
      ...s,
      tickets: s.tickets.map((x) => (x.id === id ? touch(x, text, { assignee }) : x)),
    }));
    announce(`${t.key} ${assignee ? `asignado a ${assignee}` : 'sin asignar'}.`);
  }

  function addNote(id: string, text: string) {
    const at = new Date().toISOString();
    update((s) => ({
      ...s,
      tickets: s.tickets.map((x) =>
        x.id === id
          ? { ...x, updatedAt: at, activity: [...x.activity, { at, type: 'note', text }] }
          : x,
      ),
    }));
    toast('Nota agregada');
  }

  function remove(id: string) {
    const t = getState().tickets.find((x) => x.id === id);
    openId = null;
    confirming = false;
    panel.close();
    update((s) => ({ ...s, tickets: s.tickets.filter((x) => x.id !== id) }));
    if (t) toast(`${t.key} eliminado`);
  }

  function open(id: string) {
    openId = id;
    confirming = false;
    syncUrl();
    render(getState());
  }

  /* ---- Events ---- */

  subscribe((s) =>
    render(
      s,
      boardEl.contains(document.activeElement)
        ? (document.activeElement as HTMLElement).dataset['id']
        : undefined,
    ),
  );

  initBoardDnd({
    board: boardEl,
    key: 'id',
    columns: columnIds,
    onDrop: (id, column) => setStatus(id, column as TicketStatus, true),
    onOpen: open,
  });

  search?.addEventListener('input', () => {
    filters.query = search.value;
    render(getState());
  });
  toolbar.addEventListener('change', (e) => {
    const t = e.target as HTMLSelectElement;
    if (t.name === 'automation') filters.automation = t.value;
    else if (t.name === 'assignee') filters.assignee = t.value;
    else return;
    syncUrl();
    render(getState());
  });
  clear?.addEventListener('click', () => {
    filters.automation = 'all';
    filters.assignee = 'anyone';
    filters.query = '';
    syncUrl();
    render(getState());
    search?.focus();
  });

  // Sidebar filters switch in place instead of reloading the page.
  nav?.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-automation]');
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    filters.automation = link.dataset['automation'] ?? 'all';
    syncUrl();
    render(getState());
    nav.querySelector<HTMLElement>(`a[data-automation="${filters.automation}"]`)?.focus();
  });

  panelRoot.addEventListener('change', (e) => {
    const t = e.target as HTMLSelectElement;
    if (!openId) return;
    if (t.name === 'status') setStatus(openId, t.value as TicketStatus);
    if (t.name === 'assignee') setAssignee(openId, t.value === 'none' ? null : t.value);
  });
  panelRoot.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const text = new FormData(form).get('note')?.toString().trim();
    if (openId && text) {
      addNote(openId, text);
      document.getElementById('admin-note-input')?.focus();
    }
  });
  panelRoot.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset[
      'action'
    ];
    if (!openId || !action) return;
    if (action === 'delete' || action === 'cancel-delete') {
      confirming = action === 'delete';
      render(getState());
      panelRoot
        .querySelector<HTMLElement>(
          confirming ? '[data-action="cancel-delete"]' : '[data-action="delete"]',
        )
        ?.focus();
    } else if (action === 'confirm-delete') remove(openId);
  });

  /* ---- Boot ---- */

  const deepLink = params.get('ticket');
  const linked = deepLink ? getState().tickets.find((t) => t.key === deepLink) : undefined;
  if (linked) openId = linked.id;
  syncUrl();
  render(getState());
  window.setInterval(() => refreshTimes(), 30_000);
}
