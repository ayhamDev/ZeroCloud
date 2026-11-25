# ZeroCloud websites

The user controls app development/preview servers and supplies their URL. Agents must not launch or restart those servers. Dedicated test servers are authorized for verification. The [release playbook](releases.md) explains branches, builds, test servers and production deployment.

ZeroCloud Hub is listed first as an optional companion. Its website builds with `bun run build:app-site hub` into `apps/site/build/sites/hub/`. There is no Hub installer yet. Direct downloads remain available independently.

The family catalog contains Hub, Share, Bucket and Cast. Share is a transfer between any devices; Bucket is a persistent collection replicated and automatically synchronized across devices, including restoration onto a replacement device. Automatic conflict handling is a Bucket requirement. Cast sends a screen to another device, with Google TV included in its platform plan. Encryption and security are core design requirements across the family; the catalog describes product direction rather than claiming the transport and synchronization systems already exist.

Each app has its own brand assets, overview and `faqs` entries. Keep the homepage philosophy about the whole family. List `Web` in `targets` to show a Web option in Downloads. Omit `webUrl` until a real public URL exists: the page shows a disabled “Open web app” placeholder. Adding an HTTPS `webUrl` enables that link. Cast also declares `Google TV`; there is no TV package or download to publish yet.

The public guide library and app chapters have been cleared for a fresh start. Keep `technologies`, `platformGuides` and `downloads` empty until real guides and files are published. Empty documentation pages are marked `noindex` and excluded from the sitemap; the engineering guides in this directory remain available to contributors.

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
2. Use [Share’s app record](../apps/site/src/content/apps/share/app.json) as a working example. Set the name, concise description, introduction, `overview` (short heading, workflow steps and a practical note), status metadata, target platforms, source, release-history URL and selected guide IDs. Render status through real build availability, rather than decorative badges. Set `category` for catalog filtering and `featured: true` for discovery. The optional `order` sets directory order. Discovery surfaces show at most four apps, prioritizing featured entries while retaining directory order within each group.
3. Add Markdown chapters alongside the JSON. Each chapter needs a title, description, and numeric order in its frontmatter. Its filename becomes its address. Reserve `docs`, `downloads`, `technologies`, `404`, and `robots.txt` for generated routes.
4. Build the family site and run `bun run build:app-site <slug>`. Its family address is `/apps/<slug>/`. Its independent site starts at `/` and includes its own navigation, documentation, and downloads.

## Add a guide or working example

Place a Markdown file under `apps/site/src/content/guides/<topic>/<slug>.md`. Its address is `/docs/<topic>/<slug>/`. Set `title`, `description`, `group`, and numeric `order` in frontmatter. Every article in a topic uses the same group label. Set `kind: Example` for an example and add optional `keywords` for search. Use second-level headings for sections to populate the article navigation.

Family documentation includes every published guide. Select a guide for an app with its topic and slug in the app record’s `technologies` array. No sample articles are currently published; use the frontmatter contract above when writing the new documentation.

## List a release

Keep `downloads` empty until binaries exist. Each target then shows its pending status. To publish a file listing, add an entry with `platform` matching a declared target, a `version`, the actual `file` name, a direct HTTPS `url` and the verified 64-digit hexadecimal `sha256` of the final signed file. Follow the [release security gates](releases.md#release-security-gates), including `checksums.txt` in the GitHub Release and verified publisher signatures. The family release index and app views read that record. To link a platform guide, map its target to a selected technology guide ID in the optional `platformGuides` object. Each entry is also a record in the release archive. For a dated build, add `releasedOn` in YYYY-MM-DD format. The default `channel` is `stable`. Other accepted channels are `beta`, `alpha`, `rc` and `nightly`. Optional `architecture`, `bytes` and `notesUrl` provide file details. The archive currently links to release notes; any future inline Markdown/HTML rendering must sanitize the rendered HTML before display. Keep previous entries when publishing another version. The platform listing prefers the latest stable version and the archive keeps every published file.

## Extend the design system

The [design system](design-system.md) documents the tokens, supplied mark, and motion. The interactive specimens are available at `/dev/design-system/` on the family development server. Published editions contain guides selected for readers.

## Verify

Run the authorized `bun run dev:check-servers` helper when needed, then `bun run check:external` for the full repository checks using those dedicated servers. Browser checks cover desktop and Android viewports, both editions under URL prefixes, release availability, empty documentation, progressive motion, JavaScript failure, navigation and axe accessibility scans. Viewport checks do not constitute native device verification.

## Growing the catalog

App records support `category` and `featured`. Homepage and app-menu discovery show at most four apps, prioritizing featured entries, while the full app directory and downloads remain searchable by name/purpose and category. The download hero lists at most four quick jumps; the complete catalog stays below it. Search state is linkable and keyboard accessible, and the static page keeps every app available without JavaScript.

App search, category filters and app counts belong to catalogs listing multiple apps. Individual app downloads, including standalone app editions, show their platform availability directly. A stale catalog query must not filter away the single app's downloads.

Documentation menus show at most four app columns, each with up to three published chapter/selected guide links, a documentation link and the app's common questions. Chapters appear first in their declared order, followed by selected guides. Nothing is invented while the docs are empty. At most six topic shortcuts and a search form for larger libraries lead into the complete documentation directory. Search indexes titles, descriptions, groups and keywords instead of duplicating every article body in HTML attributes. Reveal delays are capped for each visible group; they do not grow with the total number of apps or articles. Appbar docking uses its original transitions independently of the page entrance animation.
