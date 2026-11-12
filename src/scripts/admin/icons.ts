/**
 * The icons the admin demo renders, inlined as raw SVG so the same markup
 * can be produced on the server and in the browser. Only the icons listed
 * here end up in the client bundle.
 */
import { raw, type SafeHtml } from './html';

import i0 from '@/icons/inbox.svg?raw';
import i1 from '@/icons/hourglass-half.svg?raw';
import i2 from '@/icons/clock.svg?raw';
import i3 from '@/icons/check-circle.svg?raw';
import i4 from '@/icons/search.svg?raw';
import i5 from '@/icons/angle-down.svg?raw';
import i6 from '@/icons/arrows-rotate.svg?raw';
import i7 from '@/icons/play-circle.svg?raw';
import i8 from '@/icons/flask.svg?raw';
import i9 from '@/icons/wrench.svg?raw';
import i10 from '@/icons/pause-circle.svg?raw';
import i11 from '@/icons/ticket-perforated.svg?raw';
import i12 from '@/icons/layout1.svg?raw';
import i13 from '@/icons/arrow-left.svg?raw';
import i14 from '@/icons/info-circle.svg?raw';
import i15 from '@/icons/envelope.svg?raw';
import i16 from '@/icons/trash.svg?raw';
import i17 from '@/icons/time-history.svg?raw';
import i18 from '@/icons/chart-square.svg?raw';
import i19 from '@/icons/file-text.svg?raw';
import i20 from '@/icons/chat.svg?raw';
import i21 from '@/icons/arrow-up-right.svg?raw';

const sources: Record<string, string> = {
  inbox: i0,
  'hourglass-half': i1,
  clock: i2,
  'check-circle': i3,
  search: i4,
  'angle-down': i5,
  'arrows-rotate': i6,
  'play-circle': i7,
  flask: i8,
  wrench: i9,
  'pause-circle': i10,
  'ticket-perforated': i11,
  layout1: i12,
  'arrow-left': i13,
  'info-circle': i14,
  envelope: i15,
  trash: i16,
  'time-history': i17,
  'chart-square': i18,
  'file-text': i19,
  chat: i20,
  'arrow-up-right': i21,
  close:
    '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>',
};

/** Inline, decorative (aria-hidden) SVG icon. */
export function icon(name: string, className = 'admin-icon'): SafeHtml {
  const svg = sources[name];
  if (!svg) throw new Error(`Unknown admin icon: ${name}`);
  return raw(
    svg
      .trim()
      .replace(/<svg[^>]*>/, (tag) =>
        tag
          .replace(/\s(width|height|class)="[^"]*"/g, '')
          .replace(
            '<svg',
            `<svg class="${className}" width="24" height="24" aria-hidden="true" focusable="false"`,
          ),
      ),
  );
}
