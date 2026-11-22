import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { product } from '../../products/share/packages/core/src';

describe('Bun development environment', () => {
  test('loads the shared workspace package', () => {
    expect(product.id).toBe('share');
    expect(product.name).toBe('ZeroCloudShare');
  });
  test('supports native SQLite without filesystem writes', () => {
    const database = new Database(':memory:');
    try {
      expect(database.query<{ result: number }, []>('SELECT 42 AS result').get()?.result).toBe(42);
    } finally {
      database.close();
    }
  });
});
