# Test infrastructure

The baseline tests validate the scaffold and toolchain, not unimplemented product behavior.

| Layer               | Tool                               | Current verification                                |
| ------------------- | ---------------------------------- | --------------------------------------------------- |
| Portable packages   | Vitest in Node                     | Workspace linking and shared metadata types         |
| Components          | Vitest, Happy DOM, Testing Library | Shared shell renders                                |
| Bun runtime         | Bun test                           | Workspace linking and in-memory SQLite availability |
| Browser             | Playwright Chromium                | Bootstrap, errors, local-only resource loading      |
| Accessibility       | axe                                | Initial markup                                      |
| Responsive viewport | Playwright Pixel 7 profile         | Layout fits a mobile viewport                       |
| Android             | Gradle                             | JVM test task and debug APK build                   |
| Desktop             | Electrobun                         | Package build for the host OS                       |

`bun run check` runs formatting/lint, architecture boundaries, strict types, unit coverage, runtime tests, the shared production build, and browser tests. Prepare the desktop SDK and install browser binaries first.

Coverage gates: 90% statements/functions/lines and 85% branches for included files. Baseline coverage is small because product development has not started; extend tests with meaningful behavior as code is added.

Playwright retains traces, screenshots, and video on failure. Reports are under `playwright-report`; coverage is under `coverage/unit`. Browser binaries use `.cache/playwright`.

Run native builds separately with `bun run android:build` and `bun run desktop:build`. Real device execution and future networking behavior require additional validation and are not claimed by browser viewport tests.

Native instrumentation is configured with a scaffold identity smoke test. Compile it with `bun run android:test:compile`; run it on an emulator or connected device with `bun run android:test:device`. There is no native business logic to unit test yet, so the JVM test task can report NO-SOURCE.
