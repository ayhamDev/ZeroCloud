---
name: zerocloud-release
description: Prepare and carry out ZeroCloud branch, build, release and deployment workflows. Use for starting a release branch, preparing a PR or production release, publishing verified app binaries, deploying the Cloudflare Pages website, or rolling back a release. Setting up this workflow alone does not authorize publishing.
---

# ZeroCloud releases

Read the root `AGENTS.md`, current package/workflow files, and the [release playbook](../../../docs/releases.md). It contains the repository's commands, environments, versioning, artifact requirements and rollback procedure.

## Branches and scope

- Use short branches from current `main`: `codex/feat-<topic>`, `codex/fix-<topic>` or `codex/release-<product>-<version>`. Inspect the checkout first. Preserve existing uncommitted work; never reset it or bundle unrelated changes into a release.
- Keep one root Bun workspace, Git repository and `bun.lock`. Version only the owning product. Website, Share and Hub releases are independent.
- For setup-only requests, prepare the workflow without committing, pushing, merging, tagging, publishing or deploying. For an actual release request, follow the operations and environment already authorized by the user; do not request the same authorization again.

## Prepare

1. Establish the product, version, target commit and environment from the request and repository evidence. Resolve any ambiguity that could publish the wrong target before mutating remote state.
2. Inspect the diff and version fields. Follow the playbook's tag convention and check that the proposed tag does not exist. Do not bump all workspace packages together. After version edits, refresh the root lock with `bun install --lockfile-only` and verify it with `bun install --frozen-lockfile`; include `bun.lock` with the version change.
3. Build and run relevant checks. The user controls app development/preview servers: ask them to start or restart those servers and reuse their URL. The dedicated `bun run dev:check-servers` helper is authorized for verification; start it only if its test ports are not already serving the intended builds, then use `bun run check:external`. Do not take over or stop the user's app server.
4. For native files, build only supported targets. Complete platform signing and packaging, verify the expected publisher signature, then calculate SHA-256 over the final release files and prepare `checksums.txt`. This applies to prereleases too. Missing signing credentials, invalid signatures or mismatched hashes block publication. Follow the playbook's [release security gates](../../../docs/releases.md#release-security-gates). Distinguish compilation/browser tests from native device verification; catalog entries alone do not prove that an application or installer exists.
5. Prepare a PR/release description with the resulting behavior, validation, version, artifacts and material limitations. Keep binaries out of Git. Treat note bodies as untrusted: any inline Markdown/HTML renderer must sanitize the rendered HTML with DOMPurify or a maintained equivalent and have XSS regression coverage. Linking to a notes page does not require adding a renderer. Do not advertise a download URL before the file exists and is verified.

## Publish the authorized result

- `main` is the production website branch; feature branches use Cloudflare previews. Preserve the existing Pages project and audience. Do not create a second deployment channel or change hosting settings as a release side effect.
- Require passing CI for the exact commit before merge. With Git integration, merging to `main` triggers production and must be treated as deployment. Build success does not prove a live deployment succeeded.
- Every GitHub Release must include `checksums.txt`; application releases must also carry the signed files and any required signature sidecars. Re-download the public files and verify their hashes and publisher signatures before updating the app catalog with verified URLs, platform, architecture, version, date, channel and SHA-256. Keep direct downloads independent of optional Hub. Do not silently replace signed artifacts under an existing version.
- Verify the provider's successful deployment/release state, public response, canonical URLs, navigation/downloads and deployed commit. Report the actual URL and version. Stop retrying on an authorization failure, target mismatch or unexplained remote state and resolve the cause before another publication.
- Roll back using the playbook and the user's authorization. Record the restored and replaced deployment/tag references, then save a short project-memory handoff without credentials.
