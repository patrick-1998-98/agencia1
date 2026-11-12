/**
 * Muted showcase videos: play while visible, pause off-screen, stay paused
 * with prefers-reduced-motion, and keep the optional toggle button in sync.
 */

let initialised = false;

/**
 * Start videos only once the page has loaded and gone idle, so the large
 * remote downloads never compete with the LCP still or block the main thread.
 */
function whenSettled(callback: () => void): void {
  const idle = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(callback, { timeout: 2000 });
    else setTimeout(callback, 200);
  };
  if (document.readyState === 'complete') idle();
  else addEventListener('load', idle, { once: true });
}

export function initAutoplayVideos(): void {
  if (initialised) return;
  initialised = true;
  whenSettled(start);
}

function start(): void {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-autoplay-video]')];

  const sync = (video: HTMLVideoElement) => {
    const button = video.parentElement?.querySelector<HTMLButtonElement>('[data-video-toggle]');
    if (!button) return;
    const playing = !video.paused;
    button.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    button.querySelector('[data-icon-play]')?.classList.toggle('hidden', playing);
    button.querySelector('[data-icon-pause]')?.classList.toggle('hidden', !playing);
  };

  const play = (video: HTMLVideoElement) => {
    video.preload = 'auto';
    video.play().catch(() => sync(video));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        const video = target as HTMLVideoElement;
        if (isIntersecting && !video.dataset['userPaused']) play(video);
        else if (!isIntersecting) video.pause();
      }
    },
    { rootMargin: '100px' },
  );

  for (const video of videos) {
    video.addEventListener('play', () => sync(video));
    video.addEventListener('pause', () => sync(video));
    if (!reduceMotion) observer.observe(video);

    const button = video.parentElement?.querySelector<HTMLButtonElement>('[data-video-toggle]');
    const toggle = (event: Event) => {
      event.preventDefault();
      if (video.paused) {
        delete video.dataset['userPaused'];
        play(video);
      } else {
        video.dataset['userPaused'] = 'true';
        video.pause();
      }
    };
    button?.addEventListener('click', toggle);
    if (button) video.addEventListener('click', toggle);
  }
}
