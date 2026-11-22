import type { ProductDefinition } from '@zerocloud/share-contracts';

/** Shared identity for the application shells. Product behavior is not implemented. */
export const product = { id: 'share', name: 'ZeroCloudShare' } as const satisfies ProductDefinition;
