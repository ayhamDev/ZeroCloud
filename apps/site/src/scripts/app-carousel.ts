export {};

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

for (const carousel of document.querySelectorAll<HTMLElement>('[data-app-carousel]')) {
  const track = carousel.querySelector<HTMLElement>('.mega-cards');
  const cards = Array.from(carousel.querySelectorAll<HTMLElement>('.mega-card'));
  const controls = carousel.querySelector<HTMLElement>('.carousel-controls');
  const previous = carousel.querySelector<HTMLButtonElement>('[data-carousel-prev]');
  const next = carousel.querySelector<HTMLButtonElement>('[data-carousel-next]');
  const status = carousel.querySelector<HTMLElement>('.carousel-status');
  if (!track || !cards.length) continue;
  track.dataset.enhanced = '';
  if (controls) controls.hidden = false;
  let first = 0;
  let visible = 1;
  let step = 0;
  let frame = 0;
  let motion = 0;
  let wheelEnd: number | undefined;
  let drag:
    | {
        x: number;
        y: number;
        left: number;
        lastX: number;
        time: number;
        velocity: number;
        active: boolean;
      }
    | undefined;
  let suppressClick = false;

  function availability(button: HTMLButtonElement | null, disabled: boolean) {
    if (!button) return;
    if (disabled && document.activeElement === button) track?.focus({ preventScroll: true });
    button.disabled = disabled;
  }
  function update() {
    frame = 0;
    if (!track?.clientWidth) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    step = (cards[0]?.getBoundingClientRect().width ?? 0) + gap;
    if (!step) return;
    visible = Math.max(1, Math.round((track.clientWidth + gap) / step));
    first = Math.max(0, Math.min(cards.length - visible, Math.round(track.scrollLeft / step)));
    // Resizing a snap container mid-gesture can force the browser to jump.
    if (!drag && !motion && !wheelEnd) {
      const height = Math.max(
        ...cards.slice(first, first + visible).map((card) => card.offsetHeight),
      );
      const size = `${height}px`;
      if (track.style.height !== size) track.style.height = size;
    }
    const end = Math.min(first + visible, cards.length);
    const range = visible === 1 ? `${first + 1}` : `${first + 1}–${end}`;
    const label = `${range} of ${cards.length}`;
    if (status && status.textContent !== label) status.textContent = label;
    availability(previous, first === 0);
    availability(next, first + visible >= cards.length);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function stop() {
    cancelAnimationFrame(motion);
    motion = 0;
    delete track?.dataset.settling;
    clearTimeout(wheelEnd);
    wheelEnd = undefined;
  }
  function move(index: number) {
    stop();
    if (!track || !step) return;
    const target = Math.max(0, Math.min(cards.length - visible, index)) * step;
    const start = track.scrollLeft;
    const distance = target - start;
    if (motionPreference.matches || Math.abs(distance) < 0.5) {
      track.scrollLeft = target;
      schedule();
      return;
    }
    const started = performance.now();
    track.dataset.settling = '';
    const duration = Math.min(420, Math.max(200, 160 + Math.abs(distance) * 0.4));
    function tick(time: number) {
      if (!track) return;
      const progress = Math.min(1, (time - started) / duration);
      const eased = 1 - (1 - progress) ** 3;
      track.scrollLeft = start + distance * eased;
      motion = progress < 1 ? requestAnimationFrame(tick) : 0;
      if (!motion) delete track.dataset.settling;
      schedule();
    }
    motion = requestAnimationFrame(tick);
  }
  previous?.addEventListener('click', () => move(first - visible));
  next?.addEventListener('click', () => move(first + visible));
  track.addEventListener('keydown', (event) => {
    const destinations: Record<string, number> = {
      ArrowLeft: first - visible,
      ArrowRight: first + visible,
      Home: 0,
      End: cards.length - visible,
    };
    const destination = destinations[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    move(destination);
  });
  track.addEventListener('scroll', schedule, { passive: true });
  new ResizeObserver(schedule).observe(track);
  track.addEventListener('pointerdown', (event) => {
    suppressClick = false;
    if (event.button !== 0) return;
    stop();
    drag = {
      x: event.clientX,
      y: event.clientY,
      left: track.scrollLeft,
      lastX: event.clientX,
      time: performance.now(),
      velocity: 0,
      active: false,
    };
  });
  track.addEventListener('pointermove', (event) => {
    if (!drag) return;
    if (event.pointerType === 'mouse' && !event.buttons) {
      drag = undefined;
      delete track.dataset.dragging;
      schedule();
      return;
    }
    const distance = event.clientX - drag.x;
    const vertical = Math.abs(event.clientY - drag.y);
    if (!drag.active && vertical > Math.abs(distance) && vertical > 6) {
      drag = undefined;
      schedule();
      return;
    }
    if (!drag.active && Math.abs(distance) > 6) {
      drag.active = true;
      track.setPointerCapture(event.pointerId);
      track.dataset.dragging = '';
    }
    if (drag.active) {
      event.preventDefault();
      const now = performance.now();
      const velocity = (drag.lastX - event.clientX) / Math.max(1, now - drag.time);
      drag.velocity = drag.velocity * 0.6 + velocity * 0.4;
      drag.lastX = event.clientX;
      drag.time = now;
      track.scrollLeft = drag.left - distance;
    }
  });
  function endDrag(event: PointerEvent) {
    const released = drag;
    drag = undefined;
    delete track?.dataset.dragging;
    if (track?.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (released?.active) {
      suppressClick = true;
      const velocity =
        event.type === 'pointercancel' || performance.now() - released.time > 100
          ? 0
          : Math.max(-2, Math.min(2, released.velocity));
      move(Math.round(((track?.scrollLeft ?? 0) + velocity * 160) / step));
    } else move(Math.round((track?.scrollLeft ?? 0) / step));
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener(
    'wheel',
    (event) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) && !event.shiftKey) return;
      stop();
      wheelEnd = window.setTimeout(() => {
        wheelEnd = undefined;
        move(Math.round(track.scrollLeft / step));
      }, 120);
    },
    { passive: true },
  );
  track.addEventListener('dragstart', (event) => event.preventDefault());
  track.addEventListener(
    'click',
    (event) => {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
      }
    },
    true,
  );
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) move(first);
  });
  schedule();
}
