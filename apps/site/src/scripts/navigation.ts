// Retain native disclosures without JavaScript. With enhancement, defer removing
// `open` until the exit completes, while immediately hiding closing links from AT.
interface Dropdown {
  folder: HTMLDetailsElement;
  summary: HTMLElement;
  panel: HTMLElement;
  content: HTMLElement;
  expanded: boolean;
  animation?: Animation | undefined;
  resizing?: Animation | undefined;
  height: number;
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const dropdowns: Dropdown[] = [];
const hidden = { opacity: '0', transform: 'translateY(-8px) scale(0.99)' };
const visible = { opacity: '1', transform: 'none' };

function naturalHeight(dropdown: Dropdown) {
  const style = getComputedStyle(dropdown.panel);
  return Math.min(
    dropdown.content.offsetHeight +
      Number.parseFloat(style.paddingTop) +
      Number.parseFloat(style.paddingBottom),
    Number.parseFloat(style.maxHeight) || Infinity,
  );
}

function clearResize(dropdown: Dropdown) {
  dropdown.resizing?.cancel();
  dropdown.resizing = undefined;
  delete dropdown.panel.dataset.resizing;
}

function resize(dropdown: Dropdown, from = dropdown.height, to = naturalHeight(dropdown)) {
  if (!dropdown.folder.open) return;
  if (dropdown.resizing) from = Number.parseFloat(getComputedStyle(dropdown.panel).height);
  clearResize(dropdown);
  dropdown.height = to;
  if (reducedMotion.matches || Math.abs(from - to) < 1 || !from) return;
  dropdown.panel.dataset.resizing = '';
  const animation = dropdown.panel.animate([{ height: `${from}px` }, { height: `${to}px` }], {
    duration: 360,
    easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
    fill: 'both',
  });
  dropdown.resizing = animation;
  animation.onfinish = () => {
    if (dropdown.resizing === animation) clearResize(dropdown);
  };
}

function settle(dropdown: Dropdown) {
  dropdown.folder.open = dropdown.expanded;
  dropdown.animation?.cancel();
  dropdown.animation = undefined;
  if (!dropdown.expanded || reducedMotion.matches) clearResize(dropdown);
  dropdown.folder.dataset.menuState = dropdown.expanded ? 'open' : 'closed';
}

function show(dropdown: Dropdown, expanded: boolean) {
  if (dropdown.expanded === expanded) return;
  const { folder, summary, panel } = dropdown;
  const current = folder.open ? getComputedStyle(panel) : undefined;
  const from = current ? { opacity: current.opacity, transform: current.transform } : hidden;
  const previous = expanded
    ? dropdowns.find((other) => other !== dropdown && other.expanded)
    : undefined;
  const previousHeight = previous && Number.parseFloat(getComputedStyle(previous.panel).height);
  dropdown.animation?.cancel();
  dropdown.expanded = expanded;
  summary.setAttribute('aria-expanded', String(expanded));
  panel.inert = !expanded;
  panel.setAttribute('aria-hidden', String(!expanded));
  folder.dataset.menuState = expanded ? 'opening' : 'closing';
  if (expanded) {
    // Native exclusive groups would hide the previous panel before its exit.
    for (const other of dropdowns) if (other !== dropdown) show(other, false);
    folder.open = true;
    const target = naturalHeight(dropdown);
    resize(dropdown, previousHeight || target, target);
    if (previous && previousHeight) resize(previous, previousHeight, target);
  }
  if (reducedMotion.matches || typeof panel.animate !== 'function') {
    settle(dropdown);
    return;
  }
  const animation = panel.animate([from, expanded ? visible : hidden], {
    duration: expanded ? 360 : 220,
    easing: 'cubic-bezier(0.18, 0.76, 0.2, 1)',
    fill: 'both',
  });
  dropdown.animation = animation;
  animation.onfinish = () => {
    if (dropdown.animation === animation) settle(dropdown);
  };
}

for (const folder of document.querySelectorAll<HTMLDetailsElement>('.nav-folder')) {
  const summary = folder.querySelector<HTMLElement>('summary');
  const panel = folder.querySelector<HTMLElement>('.flyout');
  const content = panel?.querySelector<HTMLElement>('.menu-content');
  if (!summary || !panel || !content) continue;
  const dropdown: Dropdown = { folder, summary, panel, content, expanded: folder.open, height: 0 };
  dropdowns.push(dropdown);
  folder.removeAttribute('name');
  folder.dataset.menuState = folder.open ? 'open' : 'closed';
  summary.setAttribute('aria-expanded', String(folder.open));
  summary.setAttribute('aria-controls', `navigation-panel-${dropdowns.length}`);
  panel.id = `navigation-panel-${dropdowns.length}`;
  panel.inert = !folder.open;
  panel.setAttribute('aria-hidden', String(!folder.open));
  new ResizeObserver(() => {
    if (!dropdown.expanded) return;
    const target = naturalHeight(dropdown);
    if (Math.abs(target - dropdown.height) > 0.5) resize(dropdown, undefined, target);
  }).observe(content);
  summary.addEventListener('click', (event) => {
    event.preventDefault();
    show(dropdown, !dropdown.expanded);
  });
  panel.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a[href]')) show(dropdown, false);
  });
}

function dismissOutside(event: Event) {
  const target = event.target;
  if (!(target instanceof Node)) return;
  for (const dropdown of dropdowns) if (!dropdown.folder.contains(target)) show(dropdown, false);
}
document.addEventListener('click', dismissOutside);
document.addEventListener('focusin', dismissOutside);
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const dropdown = dropdowns.find((item) => item.expanded);
  if (!dropdown) return;
  event.preventDefault();
  show(dropdown, false);
  dropdown.summary.focus();
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) for (const dropdown of dropdowns) settle(dropdown);
});
