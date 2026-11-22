import logo from '@zerocloud/brand/icon-dark.svg';
import { product } from '@zerocloud/share-core';

/** Development entry point shared by the desktop and Android shells. */
export function App() {
  return (
    <main>
      <img src={logo} alt="ZeroCloud" width="64" height="64" />
      <h1>{product.name}</h1>
      <p>Project setup is ready.</p>
      <p className="secondary">Product implementation has not started.</p>
    </main>
  );
}
