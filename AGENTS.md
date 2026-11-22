# Project instructions

- This is a setup-only repository. Implement product features only when the user requests them.
- Use Bun from the root; preserve one workspace, Git repository, and `bun.lock`.
- Android is the only current mobile target. Do not add iOS without a request.
- Preserve supplied brand assets and original sources.
- Keep changes in the owning product; shared family assets belong in `packages/brand`.
- Use declared public exports, `workspace:*` internal dependencies, and exact stable external versions.
- Keep portable packages independent of UI and native runtimes.
- Do not edit generated SDK or native dependency sources.
- Run `bun run check` for code changes and relevant native checks for native changes.
- Distinguish browser viewport tests from native device verification.
- Do not commit, push, publish, or deploy unless requested.
