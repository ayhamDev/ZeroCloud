# ZeroCloud design system

Use the shared [tokens](../apps/site/src/styles/tokens.css) and [brand assets](../packages/brand) for the family and app websites. To inspect the specimens, run `bun run dev:site` and open [the local design preview](http://127.0.0.1:14372/dev/design-system/). The preview route exists only on the family development server.

## The mark and typography

Render the original Micro-Dot Cut SVG through [Mark.astro](../apps/site/src/components/Mark.astro). Its dot sizes, positions and four ink weights describe the diagonal cut. Use the current-color version for dark and light surfaces. Geist carries the editorial type and controls. Reserve monospace for code and small navigation labels.

## Layout

Use fog panels for related product content. In the documentation library, group articles with headings, space and a fine rule. Keep article text within a comfortable reading measure. Provide a visible keyboard focus indicator on every interactive element.

## Motion

The hero dots drift together and return to their original coordinates. The header and footer use the supplied Micro-Dot Cut loop while their marks are visible. Use the shared text-reveal component for display headings and short editorial passages. Ordinary reading text stays in the document flow. All effects follow the operating system’s reduced-motion preference. See the [website guide](website.md) for edition and content setup.
