import './desktop-scroll';

const preference = matchMedia('(prefers-reduced-motion: reduce)');
const appbar = document.querySelector<HTMLElement>('.mast-row');
function settleAppbar() {
  appbar?.setAttribute('data-arrived', '');
}
// Focus can cancel the entrance early. Retire it permanently so losing focus
// (including when a carousel arrow becomes disabled) cannot replay the fade.
appbar?.addEventListener('focusin', settleAppbar, { once: true });
appbar?.addEventListener('animationend', (event) => {
  if (event.animationName === 'appbar-arrive') settleAppbar();
});
if (preference.matches || appbar?.matches(':focus-within')) settleAppbar();
preference.addEventListener('change', () => {
  if (preference.matches) settleAppbar();
});
let observer: IntersectionObserver | undefined;
const targets = Array.from(
  document.querySelectorAll<HTMLElement>(
    '[data-enter], .prose h2, .prose p, .prose pre, .cover-emblem, .meaning-index > div, ' +
      '.release-summary, .platform-list > li, .app-tabs, .foot-links, .foot-imprint',
  ),
);
for (const target of targets) target.setAttribute('data-enter', '');

function reveal(target: HTMLElement, delay = 0, immediate = false) {
  target.style.setProperty('--enter-delay', `${delay}ms`);
  if (immediate) target.classList.add('reveal-now');
  target.classList.add('entered');
  observer?.unobserve(target);
}

function watchEntrances() {
  observer?.disconnect();
  if (preference.matches || !('IntersectionObserver' in window)) {
    document.documentElement.removeAttribute('data-reveal');
    for (const target of targets) reveal(target, 0, true);
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (a, b) =>
            targets.indexOf(a.target as HTMLElement) - targets.indexOf(b.target as HTMLElement),
        );
      for (const [index, entry] of visible.entries()) {
        reveal(entry.target as HTMLElement, Math.min(index, 5) * 90);
      }
    },
    { threshold: 0.06, rootMargin: '0px 0px -24px 0px' },
  );
  for (const target of targets) if (!target.classList.contains('entered')) observer.observe(target);
  document.documentElement.dataset.reveal = 'ready';
}
preference.addEventListener('change', watchEntrances);
watchEntrances();

function revealPath(target: Element) {
  for (const entrance of targets)
    if (entrance === target || entrance.contains(target)) reveal(entrance, 0, true);
}
document.addEventListener('focusin', (event) => {
  if (event.target instanceof Element) revealPath(event.target);
});
function revealAnchor() {
  if (!location.hash) return;
  try {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) {
      revealPath(target);
      for (const entrance of targets) if (target.contains(entrance)) reveal(entrance, 0, true);
    }
  } catch {}
}
window.addEventListener('hashchange', revealAnchor);
revealAnchor();

const loops = document.querySelectorAll<HTMLElement>(
  '[data-motion-loop], [data-motion-hub], [data-motion-product]',
);
if ('IntersectionObserver' in window && loops.length) {
  const visible = new Set<Element>();
  function refreshLoops() {
    for (const loop of loops)
      loop.toggleAttribute(
        'data-playing',
        visible.has(loop) && !preference.matches && !document.hidden,
      );
  }
  const visibility = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    refreshLoops();
  });
  for (const loop of loops) visibility.observe(loop);
  preference.addEventListener('change', refreshLoops);
  document.addEventListener('visibilitychange', refreshLoops);
  refreshLoops();
}

const headings = document.querySelectorAll<HTMLElement>('.prose h2[id]');
const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('.on-page a'));
if (headings.length && anchors.length && 'IntersectionObserver' in window) {
  const reading = new IntersectionObserver(
    (entries) => {
      const active = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!active) return;
      for (const anchor of anchors) {
        if (anchor.hash === `#${active.target.id}`) anchor.setAttribute('aria-current', 'location');
        else anchor.removeAttribute('aria-current');
      }
    },
    { rootMargin: '-8% 0px -52% 0px' },
  );
  for (const heading of headings) reading.observe(heading);
}

if (window.isSecureContext && navigator.clipboard) {
  for (const pre of document.querySelectorAll<HTMLPreElement>('.prose pre')) {
    const code = pre.querySelector('code');
    if (!code) continue;
    const shell = document.createElement('div');
    shell.className = 'code-shell';
    pre.before(shell);
    shell.append(pre);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code');
    button.setAttribute('aria-live', 'polite');
    shell.prepend(button);
    let reset: number | undefined;
    button.addEventListener('click', async () => {
      clearTimeout(reset);
      try {
        await navigator.clipboard.writeText(code.textContent ?? '');
        button.textContent = 'Copied';
        button.setAttribute('aria-label', 'Code copied');
      } catch {
        button.textContent = 'Select the code';
        button.setAttribute('aria-label', 'Select the code to copy manually');
      }
      reset = window.setTimeout(() => {
        button.textContent = 'Copy';
        button.setAttribute('aria-label', 'Copy code');
      }, 2200);
    });
  }
}
