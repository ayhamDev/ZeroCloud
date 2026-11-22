<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="packages/brand/assets/lockup-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="packages/brand/assets/lockup-light.svg">
    <img src="packages/brand/assets/lockup-light.svg" alt="ZeroCloud" width="360" height="85">
  </picture>
</p>

<p align="center"><strong>Your devices. Your data. Your control.</strong></p>

# ZeroCloud

ZeroCloud is a family of apps designed to work on your own devices without depending on cloud services.

The goal is independence: useful tools that keep working without an internet connection, a mandatory online account, or a company's servers remaining available.

**ZeroCloudShare is in its setup stage.** The project website introduces the family and its first planned app. The Share workspace contains development infrastructure and minimal application shells. There are no app releases yet.

## What ZeroCloud means

“Zero” refers to required cloud dependence. Devices can still communicate, exchange data, and run their own local services. The essential workflow should remain usable without an external backend.

Internet access can be useful for downloading the apps, receiving updates, and reading documentation. Those services should not become requirements for using the apps' core features.

## Principles

- **Work without the cloud.** Essential features should operate without an external server, including a server that introduces devices to one another.
- **Keep data under the user's control.** Process and store data locally, and transfer it directly to the device the user chooses.
- **Make accounts optional.** Basic use should not require an online identity or sign-in.
- **Build on the user's own devices.** Local networks and device-hosted services can provide the connection and capabilities that a hosted backend would otherwise supply.

These principles guide future product development. They describe the intended behavior, not features already available in this scaffold.

## First product: ZeroCloudShare

ZeroCloudShare is the first planned ZeroCloud app: direct file sharing between devices on the same local network.

Its intended workflow keeps connecting devices and transferring files on the local network, without an external discovery, signaling, or relay service. Pairing, discovery, transport, and transfer behavior will be designed during product implementation.

The current shells target desktop through Electrobun and Android through Capacitor. Android is the only mobile platform configured at this stage.

| Product            | Purpose                                | Status              |
| ------------------ | -------------------------------------- | ------------------- |
| **ZeroCloudShare** | Direct file sharing on a local network | Project scaffolding |

ZeroCloud is the umbrella project. Share is its first product; future products can live alongside it in the same workspace.

## Repository structure

```text
ZeroCloud/
├── apps/site/               Astro project website
├── products/
│   └── share/
│       ├── apps/
│       │   ├── web/          Shared React interface shell
│       │   ├── desktop/      Electrobun shell
│       │   └── android/      Capacitor Android shell
│       └── packages/
│           ├── contracts/    Portable shared types
│           └── core/         Portable product package
├── packages/brand/          Supplied logos and original brand assets
├── tooling/                 Shared compiler configuration
├── scripts/                 Build and repository checks
├── tests/                   Unit, runtime, and browser test infrastructure
└── docs/                    Development and architecture guidance
```

One Git repository, one Bun workspace, and one root lockfile cover the product family. Product folders organize the code without introducing nested package-manager roots.

## Start developing

Use **Bun 1.4.5** and **Node.js 24**. Android development also requires **JDK 21** and **Android SDK 36**.

```sh
bun install --frozen-lockfile
bun run dev
```

The minimal shared shell runs at [localhost:14370](http://127.0.0.1:14370). It is a development entry point, not a working file-sharing application.

To prepare the desktop SDK and browser test tooling, then run the JavaScript/TypeScript checks:

```sh
bun run desktop:prepare
bun run test:browsers:install
bun run check
```

Native build and device-test commands are documented in the [development guide](docs/development.md) and [testing guide](docs/testing.md).

### Project website

The family website includes an app directory, project principles, technology guides, working examples, and downloads. Each app has its own pages within the family site and can also be built as an independent static website.

| From the repository root       | Result                                                                  |
| ------------------------------ | ----------------------------------------------------------------------- |
| `bun run dev:site`             | Family website on [localhost:14372](http://127.0.0.1:14372/)            |
| `bun run dev:app-site share`   | Independent Share website on [localhost:14374](http://127.0.0.1:14374/) |
| `bun run build:site`           | Static family website in `apps/site/dist/`                              |
| `bun run build:app-site share` | Static Share website in `apps/site/build/sites/share/`                  |
| `bun run test:site`            | Desktop and mobile browser checks for both editions                     |

The [website guide](docs/website.md) covers app sites, documentation, release files, and public build settings. Contributors can find the shared typography, brand mark, and motion guidance in the [design system](docs/design-system.md).

## Development foundation

- **Bun workspaces and Turbo** for dependency management and task orchestration.
- **React, TypeScript, and Vite** for the shared interface.
- **Electrobun** for desktop and **Capacitor** for Android.
- **Biome and strict TypeScript** for formatting and code checks.
- **Vitest, Testing Library, Bun test, Playwright, and axe** for baseline test infrastructure.
- **GitHub Actions** for quality checks and native build workflows.

Dependencies are pinned to exact versions. See the [version record](docs/versions.json), [architecture decision](docs/architecture.md), and [contribution guide](CONTRIBUTING.md).

## Brand assets

The [brand package](packages/brand/README.md) contains the supplied Micro-Dot Cut logos, static and animated SVG variants, and the original brand-kit documents. The README uses the supplied static wordmarks with light and dark theme variants.
