import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import { edition } from './site';

export type Product = CollectionEntry<'apps'>;
export type Chapter = CollectionEntry<'chapters'>;
export type Guide = CollectionEntry<'guides'>;

export function groupsOf(guides: Guide[]) {
  const groups = new Map<string, { slug: string; title: string; entries: Guide[] }>();
  for (const guide of guides) {
    const [slug] = guide.id.split('/');
    if (!slug || !guide.id.includes('/'))
      throw new Error(`Place ${guide.id} inside a docs topic folder.`);
    const group = groups.get(slug) ?? { slug, title: guide.data.group, entries: [] };
    if (group.title !== guide.data.group)
      throw new Error(`Inconsistent group label in ${guide.id}.`);
    group.entries.push(guide);
    groups.set(slug, group);
  }
  return [...groups.values()];
}

export const allApps = async () =>
  (await getCollection('apps')).sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name),
  );
export async function currentEdition() {
  if (!edition) return undefined;
  const app = await getEntry('apps', edition);
  if (!app) throw new Error(`Missing content for app edition ${edition}.`);
  return app;
}
export async function chaptersFor(app: Product) {
  const chapters = await getCollection('chapters', (entry) => entry.id.startsWith(`${app.id}/`));
  for (const chapter of chapters) {
    if (['docs', 'downloads', 'technologies', '404', 'robots.txt'].includes(chapterSlug(chapter))) {
      throw new Error(`Reserved chapter name: ${chapter.id}`);
    }
  }
  return chapters.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}
export const chapterSlug = (chapter: Chapter) => chapter.id.slice(chapter.id.indexOf('/') + 1);
export async function guidesFor(app?: Product) {
  const guides = await getCollection('guides');
  const available = new Map(guides.map((guide) => [guide.id, guide]));
  const selected = app
    ? [...new Set(app.data.technologies)].map((id) => {
        const guide = available.get(id);
        if (!guide) throw new Error(`Unknown guide ${id} in ${app.id}/app.json.`);
        return guide;
      })
    : guides;
  return selected.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}
