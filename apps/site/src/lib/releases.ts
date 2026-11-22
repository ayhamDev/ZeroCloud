import type { Product } from './content';

export type Build = Product['data']['downloads'][number];
export const channelLabels = {
  stable: 'Stable',
  rc: 'Release candidate',
  beta: 'Beta',
  alpha: 'Alpha',
  nightly: 'Nightly',
} as const;
const versions = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

export function newestFirst(a: Build, b: Build) {
  return (
    (b.releasedOn ?? '').localeCompare(a.releasedOn ?? '') ||
    versions.compare(b.version, a.version) ||
    versions.compare(a.file, b.file)
  );
}

export function latestForPlatform(app: Product, platform: string) {
  const files = app.data.downloads.filter((file) => file.platform === platform).sort(newestFirst);
  const latest = files.find((file) => file.channel === 'stable') ?? files[0];
  return latest
    ? files.filter((file) => file.version === latest.version && file.channel === latest.channel)
    : [];
}

const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' });
export const releaseDate = (date: string) => dateFormat.format(new Date(`${date}T00:00:00Z`));

export function fileSize(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), units.length - 1);
  return `${Number((bytes / 1000 ** unit).toFixed(1))} ${units[unit]}`;
}
