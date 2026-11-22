---

title: Bun workspaces
description: How one install and one lockfile cover a family of projects.
group: Foundations
order: 20
keywords: [monorepo, packages, dependencies, installation]
---

## One installation

The root manifest lists directories containing packages. Bun resolves those packages together and records the dependency graph in the root `bun.lock`. A product can contain several packages without becoming a separate package-manager root.

## A dependency inside the family

Share’s core package depends on its contracts package through `workspace:*`. The package manager resolves that name to the workspace package. The shared interface can import the core package without reaching across directories by relative path.

## Reproduce the checkout

From the repository root, run:

```sh
bun install --frozen-lockfile
bun run check:boundaries
```

The frozen install checks the committed lockfile. The second command checks the repository’s package boundaries, including the allowed directions for internal dependencies.

[Bun workspace documentation](https://bun.com/docs/pm/workspaces)
