// Retain native disclosures without JavaScript. With enhancement, defer removing
// `open` until the exit completes, while immediately hiding closing links from AT.
interface Dropdown {
  folder: HTMLDetailsElement;
  summary: HTMLElement;
  panel: HTMLElement;
  expanded: boolean;
  animation?: Animation | undefined;
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const dropdowns: Dropdown[] = [];
const hidden = { opacity: '0', transform: 'translateY(-8px) scale(0.99)' };
const visible = { opacity: '1', transform: 'none' };

function settle(dropdown: Dropdown) {
  dropdown.folder.open = dropdown.expanded;
  dropdown.animation?.cancel();
  dropdown.animation = undefined;
  dropdown.folder.dataset.menuState = dropdown.expanded ? 'open' : 'closed';
}

function show(dropdown: Dropdown, expanded: boolean) {
  if (dropdown.expanded === expanded) return;
  const { folder, summary, panel } = dropdown;
  const current = folder.open ? getComputedStyle(panel) : undefined;
  const from = current ? { opacity: current.opacity, transform: current.transform } : hidden;
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
  if (!summary || !panel) continue;
  const dropdown = { folder, summary, panel, expanded: folder.open };
  dropdowns.push(dropdown);
  folder.removeAttribute('name');
  folder.dataset.menuState = folder.open ? 'open' : 'closed';
  summary.setAttribute('aria-expanded', String(folder.open));
  summary.setAttribute('aria-controls', `navigation-panel-${dropdowns.length}`);
  panel.id = `navigation-panel-${dropdowns.length}`;
  panel.inert = !folder.open;
  panel.setAttribute('aria-hidden', String(!folder.open));
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
