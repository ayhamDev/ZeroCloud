---

title: Electrobun
description: The desktop window, the Bun process, and the boundary between them.
group: Platform shells
order: 40
keywords: [desktop, native, window, webview, SDK, Hutch]
---

## A desktop host

Share’s desktop entry point creates a browser window through Electrobun. The window displays the bundled shared interface. A Bun process owns the desktop side of the application.

## Two execution environments

Code rendered in the window runs with browser APIs. The desktop process has a different set of capabilities. Work such as native file access belongs behind a deliberate platform interface. The current scaffold launches a window and leaves future transfer capabilities for implementation.

## Run the shell

```sh
bun run desktop:prepare
bun run dev:desktop
```

The prepare task sets up the pinned SDK. The development task builds the web assets and launches the desktop host. Use `bun run desktop:build` to package the scaffold for the current operating system.

[Electrobun project](https://github.com/blackboardsh/electrobun)
