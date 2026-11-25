# ZeroCloud project memory

AgentMemory 0.9.33 is development tooling for this repository. It uses the existing root Bun workspace and lockfile. Codex configuration lives in `.codex/config.toml`; the 17 upstream memory skills are installed locally under `.agents/skills`. No user-level Codex configuration or global capture hooks are installed.

The project launcher starts an isolated instance automatically when Codex opens its MCP connection. Open a new Codex session in this trusted project after setup so it loads the server and skills. An already-running chat can use the REST fallback commands below.

The MCP entry's `cwd` names this checkout explicitly. Update it if the repository is moved to another path.

## Commands

Run these from the repository root:

```sh
bun run memory start
bun run memory status
bun run memory doctor
bun run memory recall "project decisions"
bun run memory remember "Decision and the reason behind it"
bun run memory stop
```

`recall` and `remember` automatically start the project instance when it is offline. Both use the project label `ZeroCloud`. The CLI recall command expands the first five matches into complete memories. The MCP bridge exposes the full upstream tool set; use the same project label for tools that support it.

Memory slots are enabled, bringing the MCP catalog to 54 tools. The bridge requires the project server and reports failures instead of silently switching to a separate local fallback store. Smart search returns compact matches first; expand matching IDs with `memory_smart_search` when the complete memory is needed.

## Storage and isolation

| Item                                 | Location                                      |
| ------------------------------------ | --------------------------------------------- |
| Persistent database                  | `.agentmemory/data/instance-1/state_store.db` |
| Project secret                       | `.agentmemory/data/instance-1/secret`         |
| Optional settings                    | `.agentmemory/.env`                           |
| CLI profile and pinned engine        | `.agentmemory/profile/.agentmemory/`          |
| Lifecycle metadata and Compose files | `.agentmemory/data/instance-1/`               |
| REST API                             | `http://127.0.0.1:3211/agentmemory/`          |
| Memory viewer                        | `http://127.0.0.1:3213`                       |
| Internal engine WebSocket            | `ws://127.0.0.1:49234`                        |

The `.agentmemory` directory is ignored by Git. It contains the actual long-term memory and must survive normal cleanup. Stop the instance before backing up this directory. It is local machine storage; it is not synchronized by Git.

The launcher supplies a separate child-process profile, explicit data directory, environment file, secret, and ports. It forwards OS/network settings instead of inherited AgentMemory or AI-provider configuration. REST and viewer listeners bind to loopback. A server using a different secret will be rejected rather than reused. All memory tooling stays out of the product applications.

Use this project's launcher instead of the upstream `connect codex` command, which writes user-level configuration. Do not import other repositories or chat histories into this instance. This setup uses explicit curated memories; it does not install automatic transcript capture.

## Recall and retention

The default setup needs no model API key. Keyword recall uses BM25; smart search can also use available graph matches. Vector embeddings and paid LLM processing are disabled by default. Local embeddings are an optional change to `.agentmemory/.env` (`EMBEDDING_PROVIDER=local`) and require an initial model download and a restart.

Current instructions and source files take precedence over historical memories. Save concise decisions, reasons, lessons, and useful handoffs. Never store secrets, unrelated information, whole source files, or raw transcripts.

## Recovery

1. Run `bun run memory status` and `bun run memory doctor`.
2. If a port is occupied by another service, inspect that service; do not kill it or connect to it automatically. This project reserves ports 3211, 3213, and 49234.
3. Restart only this instance with `bun run memory stop` followed by `bun run memory start`. The same data directory and secret are reused.
4. If dependencies are missing, run `bun install --frozen-lockfile` from the root. Initial startup downloads and verifies the pinned iii-engine 0.25.1 and registry workers `state@0.22.22` and `http@0.22.8`.
5. If Codex does not list the project MCP server, open a fresh session in the trusted ZeroCloud project and inspect `.codex/config.toml`.

Upstream installation instructions: <https://raw.githubusercontent.com/rohitg00/agentmemory/main/INSTALL_FOR_AGENTS.md>. Skills were installed from source revision `5c9e2e698bda138dcb7de50ee4dd3260ee4fb8eb` using the skill installer with this repository's `.agents/skills` as the destination.
