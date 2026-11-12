/**
 * Cheap bot checks: a hidden honeypot field and a minimum fill time.
 * `_t` is the epoch ms when the form was rendered/interacted with; it is set
 * by the client script, so no-JS posts (which lack it) skip the timing check.
 */
export const MIN_FILL_MS = 3000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type SpamVerdict = 'ok' | 'honeypot' | 'too-fast';

export function checkSpam(input: { website?: string | undefined; _t?: number | undefined }, now = Date.now()): SpamVerdict {
  if (input.website && input.website.trim() !== '') return 'honeypot';
  if (input._t !== undefined && input._t > 0) {
    const elapsed = now - input._t;
    if (elapsed < MIN_FILL_MS || elapsed > MAX_AGE_MS) return 'too-fast';
  }
  return 'ok';
}
