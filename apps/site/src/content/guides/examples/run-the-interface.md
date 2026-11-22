---

title: Run the shared interface
description: Start Share’s existing browser shell and check what is running.
group: Examples
kind: Example
order: 70
keywords: [quick start, start, sample, localhost, dev, React]
---

## Before you start

Use a local checkout of ZeroCloud, Bun 1.4.5, and Node.js 24. Open a terminal at the repository root. This example runs the interface shell and does not require an Android emulator.

## Start the server

```sh
bun install --frozen-lockfile
bun run dev
```

Open `http://127.0.0.1:14370` on the same computer.

## Expected result

The browser displays the shared ZeroCloudShare development shell. This verifies that the workspace dependencies and interface build are working. Pairing and file transfers are planned work, so this example does not transfer a file.

## Stop the example

Press `Ctrl+C` in the terminal that started the development server.
