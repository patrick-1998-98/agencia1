/**
 * Scroll reveal: elements with [data-reveal] fade + slide in once when their
 * top crosses 85% of the viewport. Styling lives in global.css.
 *
 *   data-reveal                 reveal the element itself
 *   data-reveal-delay="0.2"     delay in seconds
 *   data-reveal-y="24"          start offset in px (default 32)
 *   data-reveal-stagger="0.1"   on a parent: reveal each child in turn
 */

function prepare(el: HTMLElement): void {
  const delay = el.dataset['revealDelay'];
  const y = el.dataset['revealY'];
  if (delay) el.style.setProperty('--reveal-delay', `${delay}s`);
  if (y) el.style.setProperty('--reveal-y', `${y}px`);

  const stagger = Number(el.dataset['revealStagger']);
  if (stagger) {
    [...el.children].forEach((child, index) => {
      if (!(child instanceof HTMLElement)) return;
      child.dataset['reveal'] = '';
      child.style.setProperty('--reveal-delay', `${Number(delay ?? 0) + index * stagger}s`);
      if (y) child.style.setProperty('--reveal-y', `${y}px`);
    });
    // The parent itself stays in place; only its children animate.
    delete el.dataset['reveal'];
  }
}

export function initReveal(root: ParentNode = document): void {
  const elements = [...root.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-stagger]')];
  elements.forEach(prepare);

  const targets = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -15% 0px' },
  );
  targets.forEach((el) => observer.observe(el));
}
