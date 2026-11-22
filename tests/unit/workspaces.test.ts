import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ProductDefinition } from '../../products/share/packages/contracts/src';
import { product } from '../../products/share/packages/core/src';

describe('portable workspace linking', () => {
  it('loads product metadata under the Node test runner', () => {
    expect(product).toEqual({ id: 'share', name: 'ZeroCloudShare' });
  });

  it('checks shared contracts without importing a platform runtime', () => {
    const definition: ProductDefinition = product;
    expectTypeOf(definition.id).toBeString();
  });
});
