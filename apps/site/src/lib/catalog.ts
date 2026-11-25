type CatalogProduct = { data: { featured: boolean } };

/** Keep discovery surfaces calm; the complete catalog belongs in the directory. */
export function featuredProducts<T extends CatalogProduct>(products: T[]): T[] {
  return [
    ...products.filter((product) => product.data.featured),
    ...products.filter((product) => !product.data.featured),
  ].slice(0, 4);
}
