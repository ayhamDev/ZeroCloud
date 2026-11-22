# Contributing

Install dependencies from the root with Bun. Do not create nested package-manager roots or lockfiles. Use `workspace:*` for internal dependencies and exact stable versions for external dependencies.

## Code practices

- Keep changes in the owning product. Extract shared packages only for a current responsibility.
- Keep `contracts` and `core` independent of React, DOM APIs, Bun, and native frameworks.
- Use strict TypeScript, named exports, explicit public types, and small modules organized by responsibility.
- Import other packages through their declared public exports and declare dependencies in their consuming package.
- Add behavior tests and relevant edge cases with each feature. Current tests verify the scaffold only.
- Use accessible markup, keyboard interaction, and reduced-motion support when interfaces are implemented.
- Do not add speculative protocols, services, plugins, or product behavior during setup work.

Run `bun run check` before considering a change ready. Run the relevant native build when native configuration changes.

`bun run setup:hooks` installs staged-file Biome checks and Conventional Commit validation. Example: `chore: configure workspace tooling`.

Vite provides hot updates for the browser development target. The desktop shell consumes the shared production build; rerun `bun run dev:desktop` after shared interface changes. Use Android Studio for native debugging and emulator/device work.

CI checks Windows and Linux and compiles the Android scaffold. A manual workflow packages desktop shells on Windows, Linux, and macOS. No publishing, signing credentials, or deployment is configured.

`renovate.json` provides grouped dependency updates after the repository is connected to Renovate. This setup does not connect an external service.

## Desktop SDK compatibility

Electrobun 2.0.7 generates `baseUrl`, which TypeScript 7 removed, and exposes SDK implementation sources. `scripts/electrobun.ts` generates declarations and a compatible mapping beside the vendor projection. It does not edit vendor files or disable application strictness. Recheck this adapter when upgrading the SDK.
