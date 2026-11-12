/** Short human-readable reference, e.g. ZY-7K3QF2. No ambiguous 0/O/1/I. */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function createTicket(prefix = 'ZY', length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let id = '';
  for (const b of bytes) id += ALPHABET[b % ALPHABET.length];
  return `${prefix}-${id}`;
}

export const TICKET_PATTERN = /^ZY-[2-9A-HJ-NP-Z]{6}$/;
