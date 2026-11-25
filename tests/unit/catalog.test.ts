import { describe, expect, it } from 'vitest';
import { featuredProducts } from '../../apps/site/src/lib/catalog';

describe('featured app discovery', () => {
  it('keeps a large catalog bounded and prioritizes featured apps without losing directory data', () => {
    const apps = Array.from({ length: 48 }, (_, id) => ({
      id,
      data: { featured: [2, 17, 35].includes(id) },
    }));
    expect(featuredProducts(apps).map((app) => app.id)).toEqual([2, 17, 35, 0]);
    expect(apps).toHaveLength(48);
  });
  it('caps discovery even when every app is featured, and keeps smaller catalogs intact', () => {
    const apps = Array.from({ length: 20 }, (_, id) => ({ id, data: { featured: true } }));
    expect(featuredProducts(apps)).toHaveLength(4);
    expect(featuredProducts(apps.slice(0, 2))).toEqual(apps.slice(0, 2));
    expect(featuredProducts([])).toEqual([]);
  });
});
