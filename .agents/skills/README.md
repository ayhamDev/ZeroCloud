# ZeroCloud memory skills

The project also includes the custom `zerocloud-release` skill for branches, verified builds, production releases and rollback. Its playbook is `docs/releases.md` at the repository root.

These 17 upstream AgentMemory skills are installed for this repository only, from <https://github.com/rohitg00/agentmemory> at revision `5c9e2e698bda138dcb7de50ee4dd3260ee4fb8eb` (AgentMemory 0.9.33). The upstream project is licensed under Apache-2.0.

Follow the root `AGENTS.md` and `docs/agentmemory.md` for this installation's paths and scope. Examples in the upstream skills use global/default settings; this project uses `bun run memory`, a separate project database, and REST/viewer ports 3211/3213. Do not use those examples to configure other projects or user-level hooks.
