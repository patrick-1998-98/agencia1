/**
 * Shared browser behaviour for the admin boards: toasts, screen-reader
 * announcements, relative-time refresh, the side panel and drag and drop.
 */
import { relativeTime } from './model';

/* ---- Announcements & toasts ------------------------------------------ */

export function announce(message: string) {
  const live = document.getElementById('admin-live');
  if (!live) return;
  live.textContent = '';
  // Re-set on the next frame so repeated messages are still read out.
  requestAnimationFrame(() => (live.textContent = message));
}

export function toast(message: string, tone: 'success' | 'error' = 'success') {
  const region = document.getElementById('admin-toasts');
  if (!region) return;
  const el = document.createElement('div');
  el.className = `admin-toast admin-toast--${tone}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  region.append(el);
  window.setTimeout(() => {
    el.classList.add('is-leaving');
    window.setTimeout(() => el.remove(), 200);
  }, 3200);
}

/* ---- Relative times --------------------------------------------------- */

/** Refresh every [data-time] label ("5m ago") under `root`. */
export function refreshTimes(root: ParentNode = document) {
  const now = Date.now();
  root.querySelectorAll<HTMLElement>('[data-time]').forEach((el) => {
    const label = relativeTime(el.dataset['time'] ?? null, now);
    if (label) el.textContent = `${el.dataset['prefix'] ?? ''}${label}`;
  });
}

/* ---- Custom selects --------------------------------------------------- */

/** Keep the visible label of each `.admin-select` in sync with its <select>. */
export function syncSelect(select: HTMLSelectElement) {
  const value = select.parentElement?.querySelector('.admin-select-value');
  if (value) value.textContent = select.selectedOptions[0]?.textContent ?? '';
}

document.addEventListener('change', (e) => {
  const t = e.target;
  if (t instanceof HTMLSelectElement && t.parentElement?.classList.contains('admin-select'))
    syncSelect(t);
});

/* ---- Side panel ------------------------------------------------------- */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface Panel {
  /** Replace the panel markup, keeping focus on the same control if possible. */
  render(markup: string): void;
  close(): void;
  readonly isOpen: boolean;
}

export function createPanel(root: HTMLElement, onClose: () => void): Panel {
  let returnFocus: HTMLElement | null = null;
  let open = false;

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      panel.close();
      return;
    }
    if (e.key !== 'Tab') return;
    const dialog = root.querySelector<HTMLElement>('.admin-panel');
    const items = dialog ? [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)] : [];
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action="close-panel"]')) panel.close();
  });

  const panel: Panel = {
    get isOpen() {
      return open;
    },
    render(markup) {
      const focusedId = root.contains(document.activeElement) ? document.activeElement?.id : '';
      const scroll = root.querySelector('.admin-panel-body')?.scrollTop ?? 0;
      if (!open) {
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        document.addEventListener('keydown', onKey);
        document.documentElement.classList.add('admin-panel-open');
      }
      root.innerHTML = markup;
      root.hidden = false;
      const body = root.querySelector('.admin-panel-body');
      if (body) body.scrollTop = scroll;
      const dialog = root.querySelector<HTMLElement>('.admin-panel');
      // Only animate the first open, not every re-render while it stays open.
      if (open) dialog?.classList.add('is-static');
      const again = focusedId ? document.getElementById(focusedId) : null;
      (again ?? (open ? null : dialog))?.focus();
      if (again instanceof HTMLInputElement || again instanceof HTMLTextAreaElement) {
        again.setSelectionRange(again.value.length, again.value.length);
      }
      open = true;
    },
    close() {
      if (!open) return;
      open = false;
      root.innerHTML = '';
      root.hidden = true;
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('admin-panel-open');
      onClose();
      if (returnFocus?.isConnected) returnFocus.focus();
      returnFocus = null;
    },
  };
  return panel;
}

/* ---- Drag and drop ---------------------------------------------------- */

export interface BoardDndOptions {
  board: HTMLElement;
  /** Attribute on each card holding its id (e.g. "id" → data-id). */
  key: 'id' | 'slug';
  /** Ordered column ids, for keyboard moves. */
  columns: readonly string[];
  onDrop(id: string, column: string): void;
  onOpen(id: string): void;
}

const DRAG_THRESHOLD = 5;
const TOUCH_HOLD_MS = 250;

/**
 * Pointer-based drag and drop between `[data-column]` sections, with a
 * keyboard alternative: Alt + ←/→ moves the focused card one column.
 */
export function initBoardDnd(opts: BoardDndOptions) {
  const { board } = opts;
  let suppressClick = false;

  board.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.admin-card');
    if (!card) return;
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    const id = card.dataset[opts.key];
    if (id) opts.onOpen(id);
  });

  board.addEventListener('keydown', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.admin-card');
    if (!card || !e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    const from = card.closest<HTMLElement>('[data-column]')?.dataset['column'];
    const index = opts.columns.indexOf(from ?? '');
    const next = opts.columns[index + (e.key === 'ArrowLeft' ? -1 : 1)];
    const id = card.dataset[opts.key];
    if (next && id) opts.onDrop(id, next);
  });

  board.addEventListener('pointerdown', (down) => {
    if (down.button !== 0) return;
    const card = (down.target as HTMLElement).closest<HTMLElement>('.admin-card');
    const id = card?.dataset[opts.key];
    if (!card || !id) return;

    const touch = down.pointerType === 'touch';
    let ghost: HTMLElement | null = null;
    let over: HTMLElement | null = null;
    let holdTimer = 0;
    let armed = !touch;
    const rect = card.getBoundingClientRect();
    const dx = down.clientX - rect.left;
    const dy = down.clientY - rect.top;

    const columnAt = (x: number, y: number) =>
      document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-column]') ?? null;

    const start = () => {
      ghost = card.cloneNode(true) as HTMLElement;
      ghost.classList.add('admin-card--ghost');
      ghost.removeAttribute('id');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.width = `${rect.width}px`;
      document.body.append(ghost);
      card.classList.add('is-dragging');
      board.classList.add('is-dragging');
    };

    const move = (e: PointerEvent) => {
      if (!ghost) {
        const far = Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) > DRAG_THRESHOLD;
        if (!far) return;
        if (!armed) return cleanup(); // touch moved before the hold: let it scroll
        start();
      }
      e.preventDefault();
      if (ghost) ghost.style.transform = `translate(${e.clientX - dx}px, ${e.clientY - dy}px)`;
      const col = columnAt(e.clientX, e.clientY);
      if (col !== over) {
        over?.classList.remove('is-over');
        col?.classList.add('is-over');
        over = col;
      }
      // Scroll the board when dragging near its edges.
      const b = board.getBoundingClientRect();
      if (e.clientX > b.right - 48) board.scrollLeft += 12;
      else if (e.clientX < b.left + 48) board.scrollLeft -= 12;
    };

    const preventScroll = (e: TouchEvent) => {
      if (ghost) e.preventDefault();
    };

    const up = (e: PointerEvent) => {
      const dragged = Boolean(ghost);
      const target = dragged ? columnAt(e.clientX, e.clientY) : null;
      cleanup();
      if (!dragged) return;
      suppressClick = true;
      window.setTimeout(() => (suppressClick = false), 0);
      const column = target?.dataset['column'];
      const from = card.closest<HTMLElement>('[data-column]')?.dataset['column'];
      if (column && column !== from) opts.onDrop(id, column);
    };

    function cleanup() {
      window.clearTimeout(holdTimer);
      ghost?.remove();
      ghost = null;
      over?.classList.remove('is-over');
      card?.classList.remove('is-dragging');
      board.classList.remove('is-dragging');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cleanup);
      window.removeEventListener('touchmove', preventScroll);
    }

    if (touch) {
      holdTimer = window.setTimeout(() => {
        armed = true;
        start();
        if (ghost)
          (ghost as HTMLElement).style.transform = `translate(${rect.left}px, ${rect.top}px)`;
      }, TOUCH_HOLD_MS);
    }

    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cleanup);
    window.addEventListener('touchmove', preventScroll, { passive: false });
  });
}
