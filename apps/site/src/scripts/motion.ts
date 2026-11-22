const preference = matchMedia('(prefers-reduced-motion: reduce)');
let observer: IntersectionObserver | undefined;

function watchEntrances() {
  observer?.disconnect();
  if (preference.matches || !('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver(
    (entries, source) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('entered');
        source.unobserve(entry.target);
      }
    },
    { threshold: 0.08 },
  );
  const targets = document.querySelectorAll('[data-enter], .prose h2, .prose p, .prose pre');
  for (const target of targets) if (!target.classList.contains('entered')) observer.observe(target);
}
preference.addEventListener('change', watchEntrances);
watchEntrances();

const loops = document.querySelectorAll<HTMLElement>('[data-motion-loop]');
if ('IntersectionObserver' in window && loops.length) {
  const visibility = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.toggleAttribute(
        'data-playing',
        entry.isIntersecting && !preference.matches && !document.hidden,
      );
    }
  });
  function watchLoops() {
    visibility.disconnect();
    for (const loop of loops) {
      if (!document.hidden && !preference.matches) visibility.observe(loop);
      else loop.removeAttribute('data-playing');
    }
  }
  preference.addEventListener('change', watchLoops);
  document.addEventListener('visibilitychange', watchLoops);
  watchLoops();
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
