# Brand assets

`assets` preserves 22 SVG blocks from the supplied kit and play-once attachment. Original pasted documents are under `source`. The manifest records each variant's source and ordinal. All supplied family SVGs remain intact.

The `once-` prefix identifies play-once assets from the supplied kit. Looping variants from that kit are retained for future selection. Respect reduced-motion preferences when using animations.

The development shell uses only a supplied static icon. Import assets through `@zerocloud/brand/*`.

## App mark system

Each app has its own silhouette in the same 64px dot system. The family cloud belongs to ZeroCloud itself and is not used as Share's product mark. Symbols stay readable at 24px and have no font or runtime dependency.

| App              | Symbol                                                                            | Dots | Tile color            | Animation root     |
| ---------------- | --------------------------------------------------------------------------------- | ---- | --------------------- | ------------------ |
| ZeroCloud Hub    | A central destination with eight satellite directions                             | 17   | Mint `#b9efd1`        | `.zch-motion`      |
| ZeroCloud Share  | Two offset tilted planes meeting at a shared seam, a folded passage for a handoff | 24   | Powder blue `#daeaff` | `.zcs-motion`      |
| ZeroCloud Bucket | An open tapered container with two stored copy layers                             | 19   | Warm sand `#f5e4c9`   | `.zcb-motion`      |
| ZeroCloud Cast   | A screen with a broadcasting corner                                               | 22   | Warm coral `#ffc5b5`  | `.zcc-motion`      |
| ZeroCloud Seek   | Radio arcs converging on a found device                                           | 16   | Warm orchid `#dda0ce` | `.zcseek-motion`   |
| ZeroCloud Ledger | Two interlocking account links                                                    | 21   | Lemon `#f2e99b`       | `.zcledger-motion` |

Share's folded passage replaces the earlier arrow pair. Its alternating plane motion brings the two surfaces slightly toward the seam without spinning the whole mark. Bucket's stored layers settle into a container. Cast sends a pulse from its screen corner. Hub follows its satellites clockwise and gives its center one restrained pulse. Seek sends a radio pulse toward a found device; Ledger brings two account links into alignment. The user chose these as S1 Beacon and L4 Linked accounts from the [direction sheets](concepts/ledger-seek/README.md). Earlier static marks are preserved with those concepts.

## Reusable exports

Every app provides the same six exports. Replace `<app>` with `hub`, `share`, `bucket`, `cast`, `seek`, or `ledger`.

| Export                                     | Use                                               |
| ------------------------------------------ | ------------------------------------------------- |
| `@zerocloud/brand/<app>-icon.svg`          | Static transparent `currentColor` symbol, 64 × 64 |
| `@zerocloud/brand/<app>-tile.svg`          | Static accent tile with an ink symbol, 128 × 128  |
| `@zerocloud/brand/<app>-icon-animated.svg` | Transparent symbol with one finite introduction   |
| `@zerocloud/brand/<app>-tile-animated.svg` | Accent tile with the same finite introduction     |
| `@zerocloud/brand/<app>-icon-loop.svg`     | Transparent symbol with a repeating motion cycle  |
| `@zerocloud/brand/<app>-tile-loop.svg`     | Accent tile with the same repeating cycle         |

`@zerocloud/brand/hub-lockup.svg` additionally pairs Hub's static mark with a Geist wordmark for light surfaces. Load the site's local Geist font when displaying that text-based SVG inline. No other mark requires a font.

All app exports are recorded under their `zerocloud-<app>` source in the manifest, separate from the original source kits. Static geometry and color are identical across an app's static, finite, and looping variants.

## Motion modes

`-animated` files play once and finish in the static composition. `-loop` files repeat smoothly, with a rest interval before the next cycle. Their beginning and end have the same transform and opacity, so there is no jump at the loop boundary. Hub's original standalone repeating motion is preserved in the explicit `-loop` files; its `-animated` files are now finite.

| App    | Finite introduction including stagger | Default loop base cycle |
| ------ | ------------------------------------- | ----------------------- |
| Hub    | 4.58 seconds                          | 4.8 seconds             |
| Share  | 1.98 seconds                          | 4.6 seconds             |
| Bucket | 2.1 seconds                           | 4.6 seconds             |
| Cast   | 2.055 seconds                         | 4.2 seconds             |
| Seek   | 1.6 seconds                           | 4.6 seconds             |
| Ledger | 1.6 seconds                           | 4.8 seconds             |

Only transforms and opacity animate. There are no filters, JavaScript dependencies, or changing geometry. A containing element may override the base duration with `--product-motion-duration`; keep the resulting finite duration plus stagger below five seconds.

Both modes independently respect `prefers-reduced-motion`, and printing always uses the static mark. Standalone SVGs follow the mode in their filename. Supply an accessible name where the mark carries meaning, or hide it from assistive technology when adjacent text already names the app.

## Inline visibility contract

Wrap inline Hub SVGs in one `data-motion-hub` element. Wrap the other apps' SVGs in one `data-motion-product` element. The mark remains completely static until that same wrapper has `data-playing`.

```html
<span data-motion-hub data-playing aria-hidden="true">
  <!-- Inline hub-icon-animated.svg or hub-icon-loop.svg here. -->
</span>
<span data-motion-product data-playing aria-hidden="true">
  <!-- Inline another app's finite or looping icon or tile here. -->
</span>
```

The website controls `data-playing` with visibility observation and removes it while the mark is offscreen or the document is hidden. Removing it cancels animation and restores the static composition. Adding it starts the chosen sequence again. A website may retain a played flag for finite introductions to avoid replay when scrolling back. Do not add `data-playing` when the user requests reduced motion; the SVG also enforces that preference independently.

Inline SVG style rules are global, so both modes are isolated explicitly. The SVG retains its app's base class and adds a mode class, such as `zcs-motion zcs-once` or `zcs-motion zcs-loop`, plus `data-motion-variant="once"` or `"loop"`. Every selector and keyframe is scoped to its app and mode. Finite and loop files, including icon and tile exports, can coexist on the same page without one variant overriding another.

## Seek preview

Open [previews/seek.html](previews/seek.html) directly in a browser to compare the static, one-time and looping tiles and the symbol at 24px, 64px and 128px. It contains its own SVGs, styles and frame-freezing harness, with no network dependencies. Add `?t=0`, `?t=0.65` or `?t=1.6` to inspect the finite reveal at a fixed time without changing the stagger. Reduced motion shows the final composition in every variant. No pause control is part of the product mark.

## Ledger preview

Open [previews/ledger.html](previews/ledger.html) for Ledger's static, finite and looping variants. Two account links come into alignment, with a quiet rest between repeating cycles. The lemon tile keeps it distinct from Bucket's warm sand. The same self-contained frame harness accepts `?t=0`, `?t=0.65` and `?t=1.6`. Reduced motion shows the final composition, and the website stops offscreen motion.
