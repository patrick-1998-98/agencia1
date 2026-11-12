/**
 * Plays the "curtain drop" before navigating to another internal page.
 * The matching "curtain lift" on the next page is pure CSS (PageTransition.astro).
 */

const LEAVE_DURATION_MS = 800;

function isInternalNavigation(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download') || anchor.dataset['noTransition'] !== undefined) return false;

  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return false;
  // Same-page anchors (#section) scroll normally.
  if (url.pathname === location.pathname && url.search === location.search) return false;
  return true;
}

export function initPageTransitions(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;

  document.addEventListener('click', (event) => {
    const anchor = (event.target as Element | null)?.closest?.('a[href]');
    if (!(anchor instanceof HTMLAnchorElement) || !isInternalNavigation(event, anchor)) return;

    event.preventDefault();
    root.classList.add('is-leaving');
    window.setTimeout(() => location.assign(anchor.href), LEAVE_DURATION_MS);
  });

  // Restored from the back/forward cache: make sure the page is visible again.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) root.classList.remove('is-leaving');
  });
}
