# Workspace architecture

Accepted for project setup on 2026-11-22.

Use one Bun workspace and lockfile, with product groups under `products/<product>`. Groups are ordinary folders containing `apps` and `packages`; they do not define nested workspaces or Git repositories.

This provides product ownership while preserving a single dependency graph and Turbo task scheduling. Nested package-manager roots would introduce multiple installs, lockfiles, and resolution rules.

| Workspace                    | Responsibility                       | Internal dependencies |
| ---------------------------- | ------------------------------------ | --------------------- |
| `@zerocloud/brand`           | Supplied assets                      | None                  |
| `@zerocloud/site`            | Family, app, and documentation sites | Brand                 |
| `@zerocloud/share-contracts` | Portable types                       | None                  |
| `@zerocloud/share-core`      | Portable product package             | Share contracts       |
| `@zerocloud/share-web`       | Shared React shell                   | Brand, Share core     |
| `@zerocloud/share-desktop`   | Electrobun shell                     | Share core            |
| `@zerocloud/share-android`   | Capacitor Android shell              | None                  |

The native shells consume the same interface build. `scripts/check-boundaries.ts` enforces the dependency directions, portable-package restrictions, and one-lockfile policy.

The family website and independently buildable app sites live in `apps/site`. Astro generates their routes from the same app records, Markdown guides, and shared design system. The website uses TypeScript 6 for its template checker. Bun installs the website’s dependencies within that workspace so Volar can resolve the TypeScript 6 language service. The other workspaces use the root TypeScript version. See the [website guide](website.md) for authoring and build commands.

## Add another product

Add `products/<name>/apps` and packages with a current responsibility. Give each workspace a unique lowercase name, extend the shared compiler settings, declare dependencies, and add the intended dependency directions to the architecture check. Install from the root.

Do not copy a root lockfile, workspace manifest, `node_modules`, or Git repository into the product group.

## Deferred decisions

File transfer protocols, QR pairing, discovery, native networking plugins, database schemas, application state libraries, and product UI remain unimplemented. There is no iOS project.

Sources: [Bun workspaces](https://bun.com/docs/pm/workspaces), [Turborepo structure](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository), [Electrobun project ownership](https://docs.electrobun.dev/electrobun/guides/project-ownership/), [Capacitor setup](https://capacitorjs.com/docs/getting-started).
