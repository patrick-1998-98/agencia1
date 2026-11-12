/**
 * Behaviour for PortfolioCarousel.astro: drives the `--rot` angle on the
 * stage. Pointer drag (with inertia), arrow keys, and the intro animation
 * trigger. Layout itself is pure CSS.
 */

const DRAG_THRESHOLD_PX = 4;
const FRICTION = 0.94;

function setupCarousel(stage: HTMLElement): void {
  const ring = stage.querySelector<HTMLElement>('[data-carousel-ring]');
  if (!ring) return;

  const count = stage.querySelectorAll('.carousel-card').length || 1;
  const step = 360 / count;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let rotation = 0;
  const apply = () => stage.style.setProperty('--rot', `${rotation}deg`);

  // Intro animation once the ring scrolls into view.
  const intro = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      stage.classList.add('is-visible');
      intro.disconnect();
    },
    { threshold: 0.15 },
  );
  intro.observe(stage);

  // --- Pointer drag ---------------------------------------------------------
  let pointerId: number | null = null;
  let lastAngle = 0;
  let startX = 0;
  let startY = 0;
  let dragged = false;
  let velocity = 0; // degrees per ms
  let lastTime = 0;
  let inertiaFrame = 0;

  const angleAt = (event: PointerEvent) => {
    const box = ring.getBoundingClientRect();
    return (Math.atan2(event.clientY - box.top, event.clientX - box.left) * 180) / Math.PI;
  };

  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    cancelAnimationFrame(inertiaFrame);
    stage.classList.remove('is-stepping');
    pointerId = event.pointerId;
    lastAngle = angleAt(event);
    startX = event.clientX;
    startY = event.clientY;
    lastTime = event.timeStamp;
    velocity = 0;
    dragged = false;
  });

  stage.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    if (!dragged) {
      if (Math.hypot(event.clientX - startX, event.clientY - startY) < DRAG_THRESHOLD_PX) return;
      dragged = true;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-dragging');
    }
    const angle = angleAt(event);
    let delta = angle - lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastAngle = angle;
    rotation += delta;
    const dt = Math.max(event.timeStamp - lastTime, 1);
    velocity = delta / dt;
    lastTime = event.timeStamp;
    apply();
  });

  const release = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    stage.classList.remove('is-dragging');
    if (!dragged || reduceMotion) return;
    let previous = performance.now();
    const coast = (now: number) => {
      const dt = now - previous;
      previous = now;
      velocity *= Math.pow(FRICTION, dt / 16);
      if (Math.abs(velocity) < 0.002) return;
      rotation += velocity * dt;
      apply();
      inertiaFrame = requestAnimationFrame(coast);
    };
    inertiaFrame = requestAnimationFrame(coast);
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);

  // A drag must not open the card it started on.
  stage.addEventListener(
    'click',
    (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    },
    true,
  );

  // --- Keyboard -------------------------------------------------------------
  stage.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    cancelAnimationFrame(inertiaFrame);
    stage.classList.toggle('is-stepping', !reduceMotion);
    rotation += event.key === 'ArrowRight' ? -step : step;
    apply();
  });
}

export function initPortfolioCarousels(): void {
  document.querySelectorAll<HTMLElement>('[data-portfolio-carousel]').forEach(setupCarousel);
}
