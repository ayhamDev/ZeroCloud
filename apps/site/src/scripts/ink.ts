import type { FieldMessage } from './ink.worker';

export function prepareField(canvas: HTMLCanvasElement) {
  if (
    !('transferControlToOffscreen' in canvas) ||
    !('IntersectionObserver' in window) ||
    typeof Worker === 'undefined'
  )
    return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = matchMedia('(forced-colors: active)');
  const events = new AbortController();
  const options = { passive: true, signal: events.signal };
  const palette = canvas.dataset.ink;
  const variant = palette === 'dark' || palette === 'downloads' ? palette : 'light';
  let visible = false;
  let readyToPaint = variant === 'downloads';
  let pending = false;
  let frame = 0;
  let worker: Worker | undefined;

  function stop() {
    worker?.terminate();
    observer.disconnect();
    events.abort();
    cancelAnimationFrame(frame);
    canvas.classList.remove('painted');
  }
  function canPaint() {
    return visible && !document.hidden && !motion.matches && !contrast.matches;
  }
  function connect() {
    pending = false;
    if (!canPaint()) return;
    try {
      worker = new Worker(new URL('./ink.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }: MessageEvent<'painted' | 'fallback'>) => {
        if (data === 'painted') canvas.classList.add('painted');
        else stop();
      };
      worker.onerror = stop;
      const surface = canvas.transferControlToOffscreen();
      worker.postMessage({ surface, variant } satisfies FieldMessage, [surface]);
      schedule();
    } catch {
      stop();
    }
  }
  function paint() {
    frame = 0;
    if (!canPaint() || !worker) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.min(960, Math.round(rect.width)));
    const height = Math.max(1, Math.round((width * rect.height) / Math.max(1, rect.width)));
    const phase =
      variant === 'downloads' ? 0.48 : 0.48 - (rect.top / Math.max(400, innerHeight)) * 0.55;
    worker.postMessage({ width, height, phase } satisfies FieldMessage);
  }
  function schedule() {
    if (!readyToPaint || !canPaint()) return;
    if (worker) {
      if (!frame) frame = requestAnimationFrame(paint);
    } else if (!pending) {
      pending = true;
      if ('requestIdleCallback' in window) window.requestIdleCallback(connect);
      else requestAnimationFrame(connect);
    }
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    schedule();
  });
  observer.observe(canvas);
  if (variant !== 'downloads') {
    window.addEventListener(
      'scroll',
      () => {
        readyToPaint = true;
        schedule();
      },
      options,
    );
  }
  window.addEventListener('resize', schedule, options);
  document.addEventListener('visibilitychange', schedule, options);
  motion.addEventListener('change', schedule, options);
  contrast.addEventListener('change', schedule, options);
}
