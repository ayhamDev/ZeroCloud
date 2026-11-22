function activateArchive(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('form');
  const list = root.querySelector<HTMLElement>('[data-archive-list]');
  const count = root.querySelector<HTMLElement>('[data-archive-count]');
  const empty = root.querySelector<HTMLElement>('[data-archive-empty]');
  const heading = root.querySelector<HTMLElement>('[data-empty-heading]');
  const body = root.querySelector<HTMLElement>('[data-empty-body]');
  const clear = root.querySelector<HTMLButtonElement>('[data-archive-clear]');
  if (!form || !list || !count || !empty || !heading || !body || !clear) return;
  const controls = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[name]'),
  );
  const rows = Array.from(list.querySelectorAll<HTMLDetailsElement>('[data-archive-build]'));
  const initialTitle = heading.textContent;
  const initialBody = body.textContent;
  let order = '';

  const update = (syncUrl: boolean) => {
    const values = new FormData(form);
    const url = new URL(location.href);
    const terms = String(values.get('q') ?? '')
      .trim()
      .toLowerCase()
      .split(/\s+/u)
      .filter(Boolean);
    let matches = 0;
    for (const row of rows) {
      const included =
        ['app', 'platform', 'channel'].every(
          (key) => !values.get(key) || values.get(key) === row.dataset[key],
        ) && terms.every((term) => row.dataset.keywords?.includes(term));
      row.hidden = !included;
      if (included) matches++;
    }
    const nextOrder = String(values.get('order') ?? '');
    if (order !== nextOrder) {
      // Undated legacy builds follow dated builds in either direction.
      const ordered = nextOrder
        ? [
            ...rows.filter((row) => row.dataset.date).reverse(),
            ...rows.filter((row) => !row.dataset.date).reverse(),
          ]
        : rows;
      list.append(...ordered);
      order = nextOrder;
    }
    const filtering = controls.some(({ value, name }) => name !== 'order' && value.trim());
    const result = filtering && rows.length ? `${matches} of ${rows.length}` : String(matches);
    count.textContent = `${result} ${(filtering ? rows.length : matches) === 1 ? 'build' : 'builds'}`;
    empty.hidden = matches > 0;
    heading.textContent = filtering ? 'No matching builds' : initialTitle;
    body.textContent = filtering
      ? 'Try another version or clear the filters to see every build.'
      : initialBody;
    clear.hidden = !controls.some(({ value }) => value);
    if (syncUrl) {
      for (const control of controls) {
        if (control.value) url.searchParams.set(control.name, control.value);
        else url.searchParams.delete(control.name);
      }
      if (url.href !== location.href) history.replaceState(history.state, '', url);
    }
  };

  function restore() {
    const params = new URLSearchParams(location.search);
    for (const control of controls) {
      control.value = params.get(control.name) ?? '';
      if (control instanceof HTMLSelectElement && control.selectedIndex < 0)
        control.selectedIndex = 0;
    }
    update(false);
  }
  form.addEventListener('input', () => update(true));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    update(true);
  });
  clear.addEventListener('click', () => {
    form.reset();
    update(true);
    controls[0]?.focus();
  });
  window.addEventListener('popstate', restore);
  restore();
  form.hidden = false;

  if (window.isSecureContext && navigator.clipboard) {
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-copy-hash]')) {
      button.hidden = false;
      button.addEventListener('click', async () => {
        const value = button.parentElement?.querySelector('code')?.textContent;
        if (!value) return;
        try {
          await navigator.clipboard.writeText(value);
          button.textContent = 'Copied';
        } catch {
          button.textContent = 'Select the checksum to copy';
        }
      });
    }
  }
}
for (const archive of document.querySelectorAll<HTMLElement>('[data-archive]'))
  activateArchive(archive);
