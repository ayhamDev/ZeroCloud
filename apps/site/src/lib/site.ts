export const repository = 'https://github.com/ayhamDev/ZeroCloud';
export const base = import.meta.env.BASE_URL.replace(/\/?$/u, '/');
export const edition = process.env.ZEROCLOUD_APP || undefined;
export const link = (path = '') => base + path;
export function appLink(slug: string, section = '') {
  return link(`${edition ? '' : `apps/${slug}/`}${section ? `${section}/` : ''}`);
}
export const guideLink = (id: string) => link(`docs/${id}/`);
export function githubReleaseRepository(url: string) {
  const address = new URL(url);
  const path = /^\/([^/]+\/[^/]+)\/releases\/?$/u.exec(address.pathname);
  return address.hostname === 'github.com' && path ? `${address.origin}/${path[1]}` : undefined;
}
