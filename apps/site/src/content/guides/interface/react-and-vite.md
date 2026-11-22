---

title: React and Vite
description: How the same interface reaches the browser and both platform shells.
group: Interface
order: 30
keywords: [webview, UI, TypeScript, components, hot reload]
---

## Describe the interface

The shared Share interface lives in `products/share/apps/web`. React components describe what the user sees. Reusing the same components gives the native shells a common starting point.

## Develop in a browser

Vite serves the interface during development and updates it as source files change. The root command `bun run dev` starts this development server. It is useful for working on screens before preparing a native package.

## Produce static assets

```sh
bun run build:web
```

Vite builds the application’s HTML, JavaScript, and styles. The desktop packaging step and the Android sync step consume that output. Native capabilities still belong to the platform that supplies them.

[React components](https://react.dev/learn/describing-the-ui) · [Vite guide](https://vite.dev/guide/)
