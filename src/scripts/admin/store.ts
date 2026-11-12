/**
 * Per-visitor demo state. Seeded from the bundled sample, kept in memory and
 * mirrored to sessionStorage so edits survive moving between the tickets and
 * setup boards in the same tab. Nothing ever leaves the browser.
 */
import { loadSample, type AdminState } from './model';

const KEY = 'zypher-admin-demo';

type Listener = (state: AdminState) => void;

let state: AdminState | null = null;
const listeners = new Set<Listener>();

function read(): AdminState | null {
  try {
    const stored = sessionStorage.getItem(KEY);
    return stored ? (JSON.parse(stored) as AdminState) : null;
  } catch {
    return null;
  }
}

function write(next: AdminState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: the demo still works in memory */
  }
}

export function getState(): AdminState {
  state ??= read() ?? loadSample();
  return state;
}

/** Apply an immutable update, persist it and notify subscribers. */
export function update(fn: (draft: AdminState) => AdminState) {
  state = fn(getState());
  write(state);
  listeners.forEach((l) => l(state as AdminState));
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Back to the sample data (keeps nothing from this session). */
export function reset(part: 'board' | 'all' = 'all') {
  const fresh = loadSample();
  update((s) => (part === 'board' ? { ...s, board: fresh.board } : fresh));
}
