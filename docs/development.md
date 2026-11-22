# Development guide

A Bun monorepo for the ZeroCloud product family. The first product, **ZeroCloudShare**, lives under `products/share`.

**Setup only:** the applications display a minimal development screen. No file sharing, pairing, discovery, networking service, custom plugin, or product interface is implemented. Android is the only mobile target.

## Start developing

Prerequisites: Bun 1.4.5, Node.js 24, and Git. Android development also needs JDK 21, Android Studio, and Android SDK 36.

```sh
bun install --frozen-lockfile
bun run desktop:prepare
bun run test:browsers:install
bun run setup:hooks
bun run dev
```

Vite serves the shared interface at `http://127.0.0.1:14370` with hot updates. Browser tests use their own server on port 14371 and never reuse an unrelated server.

## Structure

```text
ZeroCloud/
  products/share/
    apps/
      web/                  Shared React application shell
      desktop/              Electrobun shell
      android/              Capacitor configuration and native Android project
    packages/
      contracts/            Portable shared types
      core/                 Portable package, currently identity metadata only
  packages/brand/           Supplied SVG assets and original source documents
  tooling/typescript/       Shared strict TypeScript settings
  scripts/                  Build and repository checks
  tests/{unit,runtime,e2e}/ Test infrastructure
  docs/                    Architecture and test guidance
  .github/                 CI and pull request template
  bun.lock                 Single dependency lockfile
```

These are product groups inside one workspace, not nested package-manager roots. Add future products beside `share`; keep one root install and lockfile.

## Commands

| Command                           | Purpose                                            |
| --------------------------------- | -------------------------------------------------- |
| `bun run dev`                     | Shared interface with Vite hot updates             |
| `bun run dev:desktop`             | Build the shared interface and open Electrobun     |
| `bun run build:web`               | Production build of the shared interface           |
| `bun run desktop:prepare`         | Prepare the pinned SDK and TypeScript declarations |
| `bun run desktop:build`           | Package the desktop shell for the current OS       |
| `bun run android:sync`            | Build the interface and sync Capacitor Android     |
| `bun run android:open`            | Open Android Studio                                |
| `bun run android:build`           | Build a debug APK                                  |
| `bun run android:test`            | Run native JVM tests                               |
| `bun run doctor`                  | Check prerequisites                                |
| `bun run lint` / `bun run format` | Check / apply Biome formatting and lint            |
| `bun run typecheck`               | Check every workspace and tooling                  |
| `bun run check:boundaries`        | Enforce dependency directions and one lockfile     |
| `bun run test:coverage`           | Vitest tests and coverage gates                    |
| `bun run test:runtime`            | Bun runtime smoke tests                            |
| `bun run test:e2e`                | Browser bootstrap and accessibility tests          |
| `bun run check`                   | Complete JavaScript/TypeScript checks              |
| `bun run audit:dependencies`      | Audit installed dependencies                       |

Native builds are separate from `check` because they need platform toolchains. Browser tests with an Android viewport do not replace native device tests.

## Toolchain

React 19, Vite 8, TypeScript 7, Electrobun 2, Capacitor 8, Turbo, Biome, Vitest, Testing Library, Playwright, and axe. Direct dependencies use exact stable versions; `docs/versions.json` records the verified versions.

Bun is pinned locally to prevent workspace scripts from using a different Bun executable installed in a parent folder. The Electrobun launcher downloads its pinned Hutch/SDK into `.cache/hutch`; a global Hutch installation is not required.

Read [CONTRIBUTING.md](../CONTRIBUTING.md), [architecture](architecture.md), [testing](testing.md), and [brand assets](../packages/brand/README.md) before extending the scaffold.
