/**
 * Setup board controller (/admin/automations/setup): request types move
 * between Backlog → Setting up → Testing → Live → Paused.
 */
import { setupColumns, type SetupStage } from '@/data/admin/config';
import {
  automationBySlug,
  openCounts,
  setupStats,
  sortAutomations,
  type AdminState,
  type SetupSort,
} from './model';
import { getState, reset, subscribe, update } from './store';
import { navItems, setupBoard, setupPanel, stats } from './templates';
import { announce, createPanel, initBoardDnd, refreshTimes, syncSelect, toast } from './ui';

const stageLabel = (s: string) => setupColumns.find((c) => c.id === s)?.label ?? s;
const columnIds = setupColumns.map((c) => c.id);

export function initSetup(app: HTMLElement) {
  const statsEl = app.querySelector<HTMLElement>('[data-region="stats"]');
  const boardEl = app.querySelector<HTMLElement>('[data-region="board"]');
  const toolbar = app.querySelector<HTMLElement>('[data-region="toolbar"]');
  const panelRoot = document.getElementById('admin-panel-root');
  const nav = document.querySelector<HTMLElement>('.admin-nav');
  if (!statsEl || !boardEl || !toolbar || !panelRoot) return;

  let query = '';
  let sort: SetupSort = 'board';
  let openSlug: string | null = null;
  let draft: Record<string, string> = {};

  const panel = createPanel(panelRoot, () => {
    openSlug = null;
    syncUrl();
  });

  function syncUrl() {
    const url = new URL(location.href);
    if (openSlug) url.searchParams.set('edit', openSlug);
    else url.searchParams.delete('edit');
    history.replaceState(history.state, '', url);
  }

  function render(state: AdminState, focusSlug?: string) {
    const now = Date.now();
    const scroll = boardEl!.scrollLeft;
    statsEl!.innerHTML = stats(setupStats(state.board)).value;
    boardEl!.innerHTML = setupBoard(sortAutomations(state, query, sort), state, now).value;
    boardEl!.scrollLeft = scroll;
    if (nav) nav.innerHTML = navItems('setup', 'all', openCounts(state.tickets)).value;
    if (focusSlug)
      boardEl!.querySelector<HTMLElement>(`[data-slug="${CSS.escape(focusSlug)}"]`)?.focus();
    const automation = openSlug ? automationBySlug[openSlug] : undefined;
    if (automation) panel.render(setupPanel(automation, state, now, draft).value);
    else if (panel.isOpen) panel.close();
  }

  /* ---- Mutations ---- */

  const patchBoard = (
    slug: string,
    fn: (b: AdminState['board'][string]) => AdminState['board'][string],
  ) =>
    update((s) => {
      const current = s.board[slug];
      if (!current) return s;
      return {
        ...s,
        board: { ...s.board, [slug]: { ...fn(current), updatedAt: new Date().toISOString() } },
      };
    });

  function setStage(slug: string, stage: SetupStage) {
    const a = automationBySlug[slug];
    if (!a || getState().board[slug]?.stage === stage) return;
    patchBoard(slug, (b) => ({ ...b, stage }));
    announce(`${a.title} movido a ${stageLabel(stage)}.`);
  }

  function open(slug: string) {
    openSlug = slug;
    draft = { ...(getState().board[slug]?.settings ?? {}) };
    syncUrl();
    render(getState());
  }

  /* ---- Events ---- */

  subscribe((s) =>
    render(
      s,
      boardEl.contains(document.activeElement)
        ? (document.activeElement as HTMLElement).dataset['slug']
        : undefined,
    ),
  );

  initBoardDnd({
    board: boardEl,
    key: 'slug',
    columns: columnIds,
    onDrop: (slug, column) => setStage(slug, column as SetupStage),
    onOpen: open,
  });

  toolbar.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name !== 'q') return;
    query = t.value;
    render(getState());
  });
  toolbar.addEventListener('change', (e) => {
    const t = e.target as HTMLSelectElement;
    if (t.name !== 'sort') return;
    sort = t.value as SetupSort;
    render(getState());
  });
  toolbar.querySelector('[data-action="reset-board"]')?.addEventListener('click', () => {
    reset('board');
    if (openSlug) draft = { ...(getState().board[openSlug]?.settings ?? {}) };
    toast('Tablero restablecido con los datos de ejemplo');
    announce('Tablero restablecido.');
  });

  panelRoot.addEventListener('change', (e) => {
    const t = e.target as HTMLSelectElement;
    if (openSlug && t.name === 'stage') setStage(openSlug, t.value as SetupStage);
  });
  panelRoot.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    const label = t.dataset['setting'];
    if (!openSlug || !label) return;
    const wasDirty = isDirty();
    draft = { ...draft, [label]: t.value };
    // Only re-render when the Save/Discard state flips, so typing is never interrupted.
    if (wasDirty !== isDirty()) render(getState());
  });
  panelRoot.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!openSlug) return;
    const form = e.target as HTMLFormElement;
    if (form.dataset['form'] === 'settings') {
      const settings = { ...draft };
      patchBoard(openSlug, (b) => ({ ...b, settings }));
      toast('Cambios guardados');
    } else {
      const text = new FormData(form).get('note')?.toString().trim();
      if (!text) return;
      patchBoard(openSlug, (b) => ({
        ...b,
        notes: [...b.notes, { text, at: new Date().toISOString() }],
      }));
      toast('Nota agregada');
      document.getElementById('admin-note-input')?.focus();
    }
  });
  panelRoot.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset[
      'action'
    ];
    if (action !== 'discard' || !openSlug) return;
    draft = { ...(getState().board[openSlug]?.settings ?? {}) };
    render(getState());
  });

  function isDirty() {
    const saved = openSlug ? getState().board[openSlug]?.settings : undefined;
    return JSON.stringify(draft) !== JSON.stringify(saved ?? {});
  }

  /* ---- Boot ---- */

  const edit = new URLSearchParams(location.search).get('edit');
  if (edit && edit in automationBySlug) open(edit);
  else render(getState());
  toolbar.querySelectorAll('select').forEach(syncSelect);
  window.setInterval(() => refreshTimes(), 30_000);
}
