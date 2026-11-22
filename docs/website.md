# ZeroCloud websites

Use the root Bun workspace for every website. The family edition and app editions use the same Astro templates. Their output is plain HTML, CSS, local Geist font files, and small browser scripts. A static host can serve either edition.

| Edition | Development                  | Build                          | Preview                          | Output                         |
| ------- | ---------------------------- | ------------------------------ | -------------------------------- | ------------------------------ |
| Family  | `bun run dev:site`           | `bun run build:site`           | `bun run preview:site`           | `apps/site/dist/`              |
| Share   | `bun run dev:app-site share` | `bun run build:app-site share` | `bun run preview:app-site share` | `apps/site/build/sites/share/` |

The family server uses port 14372. An app server uses port 14374. Use `SITE_URL` for a public build. Its origin and optional path determine asset URLs, canonical URLs, social metadata, and the sitemap. Set it to the address where that edition will be served. In PowerShell, for example, `$env:SITE_URL = 'https://your-domain.example/share/'`. Use the same setting when previewing a build made for a path prefix.

## Deploy on Cloudflare Pages

Connect the ZeroCloud repository and use these build settings for the family website. Its output includes the Share pages under `/apps/share/`.

| Pages setting          | Value                                                 |
| ---------------------- | ----------------------------------------------------- |
| Production branch      | `main`                                                |
| Framework preset       | Astro                                                 |
| Root directory         | Leave blank to use the repository root                |
| Build command          | `bun install --frozen-lockfile && bun run build:site` |
| Build output directory | `apps/site/dist`                                      |

Set `BUN_VERSION` to `1.4.5` and `SKIP_DEPENDENCY_INSTALL` to `1` for production and preview builds. The command installs from the shared `bun.lock` once and builds the website. The root `.node-version` selects Node 24. Set `SITE_URL` to the stable public origin of the site so that canonical links and the sitemap point to production. [Cloudflare Pages build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/) · [Build image and environment variables](https://developers.cloudflare.com/pages/configuration/build-image/)

## Add an app

1. Create `apps/site/src/content/apps/<slug>/app.json`. Choose a lowercase slug beginning with a letter. Use letters, numbers, and hyphens.
2. Use [Share’s app record](../apps/site/src/content/apps/share/app.json) as a working example. Set the full name, short name, description, introduction, status, target platforms, source, release-history URL, and selected guide IDs. The optional `order` sets placement in the directory. The lowest ordered app appears on the family home.
3. Add Markdown chapters alongside the JSON. Each chapter needs a title, description, and numeric order in its frontmatter. Its filename becomes its address. Reserve `docs`, `downloads`, `technologies`, `404`, and `robots.txt` for generated routes.
4. Build the family site and run `bun run build:app-site <slug>`. Its family address is `/apps/<slug>/`. Its independent site starts at `/` and includes its own navigation, documentation, and downloads.

## Add a guide or working example

Place a Markdown file under `apps/site/src/content/guides/<topic>/<slug>.md`. Its address is `/docs/<topic>/<slug>/`. Set `title`, `description`, `group`, and numeric `order` in frontmatter. Every article in a topic uses the same group label. Set `kind: Example` for an example and add optional `keywords` for search. Use second-level headings for sections to populate the article navigation.

Family documentation includes every guide. Select a guide for an app with its topic and slug in the app record’s `technologies` array. The [working shell example](../apps/site/src/content/guides/examples/run-the-interface.md) shows the article format.

## List a release

Keep `downloads` empty until binaries exist. Each target then shows its pending status. To publish a file listing, add an entry with `platform` matching a declared target, a `version`, the actual `file` name, and a direct HTTPS `url`. The family release index and both app views read that record. To link a platform guide, map its target to a selected technology guide ID in the optional `platformGuides` object. Each entry is also a record in the release archive. For a dated build, add `releasedOn` in YYYY-MM-DD format. The default `channel` is `stable`. Other accepted channels are `beta`, `alpha`, `rc` and `nightly`. Optional `architecture`, `bytes`, `notesUrl` and a 64-digit hexadecimal `sha256` provide file details. Keep previous entries when publishing another version. The platform listing prefers the latest stable version and the archive keeps every published file.

## Extend the design system

The [design system](design-system.md) documents the tokens, supplied mark, and motion. The interactive specimens are available at `/dev/design-system/` on the family development server. Published editions contain guides selected for readers.

## Verify

Run `bun run test:site` for browser checks at desktop and Android viewport sizes. They build both editions under URL prefixes, exercise the release and documentation flows, and scan key pages with axe. Run `bun run check` for the full repository checks.
