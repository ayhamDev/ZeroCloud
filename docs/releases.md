# Branches, releases and deployment

The production website follows `main`. Work on small branches and merge a reviewed, verified commit. App installers have independent versions and release artifacts. Setting up this workflow does not publish anything.

## Branch and review

Inspect `git status --short` and preserve existing work. Start from an up-to-date `main` using `feat/<topic>`, `fix/<topic>` or `release/<product>-<version>`. Use project/task names without assistant branding, attribution or co-author trailers. Use one PR per coherent change, describing behavior, validation and limits. Prefer squash merges. Commit, push and merge only when requested; delete the completed feature branch locally and remotely after an authorized merge.

The repository owner should protect `main` with required PR review and the existing CI jobs: `quality (ubuntu-latest)`, `quality (windows-latest)` and `android`. These are configuration requirements; this document does not claim remote rules have been set. Avoid force pushes and direct production commits.

## Build and verify

The user controls app development/preview servers. Reuse their URL and ask them to start or restart those servers. The following dedicated test-server helper is authorized for verification:

```sh
bun run dev:check-servers
```

It starts the app test server on 14371, the family build at `http://127.0.0.1:14373/publication/` and the independent Share build at `http://127.0.0.1:14375/share-preview/`. Then run:

```sh
bun run check:external
```

This runs `bun run check` with `ZEROCLOUD_EXTERNAL_SERVERS=1`. Playwright starts no additional servers and uses the dedicated ones already running. The test builds are snapshots: after source changes, restart only the owned test helper before verification. Never restart or stop the user's app server. `bun run check` retains automatic servers for CI and direct user use; the external-server variant separates test-server ownership from test execution locally.

Local Windows browser tests use one worker to avoid competing with desktop browser/GPU processes. CI keeps two workers. This changes concurrency, not the tests or their assertions.

| Scope                   | Build and additional evidence                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Family website          | `bun run build:site`; review the user's `bun run dev:site` URL                                                                                           |
| Independent app website | `bun run build:app-site share` or `bun run build:app-site hub`                                                                                           |
| Share desktop           | `bun run desktop:prepare`, then `bun run desktop:build`; the existing manual native-builds workflow covers Windows, Linux and macOS desktop              |
| Share Android           | `bun run android:build`, `bun run android:test`, `bun run android:test:compile`; `bun run android:test:device` additionally needs a real emulator/device |
| Hub application         | No application or installer exists yet; do not announce a binary                                                                                         |

Android viewport tests are browser verification, not native device verification. Public installers require the applicable signing and distribution steps. Current debug builds are not stable signed releases.

## Versions and artifacts

Use SemVer per product, with `site/v1.2.3`, `share/v1.2.3` or `hub/v1.2.3` tags and suffixes such as `-beta.1` for prereleases. These are future conventions, not existing release claims. Version the website in `apps/site/package.json`. For native apps, inspect and synchronize the owning package and native version/build fields. Do not bump the root workspace or other products to match.

After changing package version fields, run `bun install --lockfile-only` from the root, then `bun install --frozen-lockfile` to verify the shared lockfile. Bun records workspace versions in `bun.lock`, so version edits must include that lock update before the release commit.

Build from the exact reviewed commit. Record the product, version, full commit SHA, OS/architecture, build commands, test evidence and SHA-256 per file. Keep binaries out of the source repository. App tags accompany GitHub Releases and installer assets; website tags record the production commit.

After a file is public and verified, add it to `apps/site/src/content/apps/<app>/app.json` using `platform`, `version`, `file`, direct HTTPS `url`, `releasedOn`, `channel`, `architecture`, `sha256` and optional `bytes`/`notesUrl`. Keep prior files for the archive. Leave `downloads` empty when no binaries exist. Hub stays optional; direct Share downloads must not require it.

## Release security gates

These are required publication checks, including for alpha, beta, release-candidate and nightly releases. The current CI and manual native-build workflow build development artifacts; they do not implement a signed publishing pipeline or prove these gates have passed.

### Signed binaries and SHA-256 checksums

1. Build from the exact reviewed commit, then complete packaging and the applicable code signing, timestamping and platform distribution steps. Sign executables and installers with the established release identity. For a format without embedded code signing, supply a verifiable detached signature from the established release key.
2. Verify the final signatures and expected publisher/key identity with the platform tools. Windows uses Authenticode/SignTool; macOS distribution uses Developer ID signing and the applicable notarization/stapling steps; Android requires the release signing identity rather than a debug key. Keep private keys and signing credentials in the approved secret store. If credentials are unavailable or verification fails, stop publication rather than shipping an unsigned substitute.
3. Generate UTF-8 `checksums.txt` after every byte-changing signing, packaging or stapling operation is finished. Use one SHA-256 line per shipped file in the form `<64 lowercase hex characters>  <exact asset filename>`. Cover binaries, installers, archives and their signature sidecars; omit the manifest itself and any signature over that manifest to avoid circular hashes. Regenerate the manifest if any asset changes.
4. Attach `checksums.txt` to every GitHub Release alongside its verified artifacts. Prepare uploads in a draft release and verify the downloaded assets, manifest and publisher signatures before publishing. Recheck the public files after publication, then publish catalog download links. Every catalog file listing must include the matching SHA-256. Preserve prior release files instead of replacing them in place.

Checksums detect changed bytes; publisher signatures establish authenticity. Hub and other future update clients must verify both against the expected release identity before installing or executing a download. A checksum manifest from the same download source does not replace signature verification.

Platform references: [Microsoft SignTool](https://learn.microsoft.com/en-us/windows/win32/seccrypto/signtool), [Android app signing](https://developer.android.com/studio/publish/app-signing), [Apple notarization](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution).

### Sanitized release notes

Treat notes from GitHub, APIs, files and caches as untrusted, even when they come from our own repository. For inline display in the website, an app or Hub:

- Parse Markdown into HTML first; pass that HTML, or incoming HTML, through DOMPurify or a maintained equivalent before rendering. Prefer an HTML-only profile for notes. Never send raw note bodies into `innerHTML`, `set:html` or `dangerouslySetInnerHTML`.
- Do not reparse or modify sanitized markup in a way that introduces unchecked HTML. If sanitization cannot run, show escaped plain text or omit the content instead of injecting raw HTML.
- Keep the sanitizer and its DOM implementation current. For server rendering, follow the sanitizer's supported DOM guidance; the repository's `happy-dom` test dependency is not an approved production DOMPurify environment.
- Before introducing or changing a notes renderer, test scripts, event-handler attributes, unsafe URL schemes and malicious Markdown/raw-HTML combinations, along with normal formatting. Require those tests before merging the renderer.

The current release archive only links to the HTTPS `notesUrl`; it does not fetch or render note bodies. Add a sanitizer dependency when formatted inline rendering is implemented. [DOMPurify's usage and server-rendering guidance](https://github.com/cure53/DOMPurify#how-do-i-use-it) documents HTML-only profiles and the risks of post-sanitization mutation and unsupported DOM implementations.

## Website deployment

The site identified by the user is `https://zero-cloud.pages.dev`. Verify its repository integration and current settings before acting; local files alone cannot prove them. Keep one production deployment channel.

| Setting           | Value                                                                          |
| ----------------- | ------------------------------------------------------------------------------ |
| Production branch | `main`                                                                         |
| Preview branches  | Reviewed non-production branches such as `feat/*`, `fix/*` and `release/*`     |
| Repository root   | Root of this workspace                                                         |
| Build             | `bun install --frozen-lockfile && bun run build:site`                          |
| Output            | `apps/site/dist`                                                               |
| Bun               | `BUN_VERSION=1.4.5`, `SKIP_DEPENDENCY_INSTALL=1`                               |
| Canonical origin  | `SITE_URL=https://zero-cloud.pages.dev` or the actual production custom domain |

With Git integration, feature pushes create previews. Review the preview and exact-commit CI before merging. A merge to `main` triggers production, so merge authorization must include that release. Observe the successful Cloudflare deployment and matching commit, then check the public page, canonical URL, metadata, navigation and file links. A build or queued deployment is not a live release.

Consult Cloudflare's [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/), [branch controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/) and [build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/). Change hosting settings only when requested. Store credentials in provider/GitHub secrets, never in source or release notes.

## Rollback

For an authorized urgent website rollback, restore a known successful production deployment in Cloudflare Pages. Preview deployments are not valid rollback targets. Record the restored deployment and commit, verify the public response, and follow with a revert/fix PR so the next build does not restore the bug. See [Cloudflare rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/).

For an app issue, withdraw the faulty catalog download and clearly mark the affected release. Restore verified prior files where appropriate, then ship a new patch version. Do not silently replace an installer under the same version or reuse an existing tag.
