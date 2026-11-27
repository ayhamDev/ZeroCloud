# ZeroCloud design system

Use the shared [tokens](../apps/site/src/styles/tokens.css) and [brand assets](../packages/brand) for the family and app websites. Ask the user to start `bun run dev:site`, then open [the local design preview](http://127.0.0.1:14372/dev/design-system/). The preview route exists only on the family development server.

## The mark and typography

Render the original Micro-Dot Cut SVG through [Mark.astro](../apps/site/src/components/Mark.astro). Its dot sizes, positions and four ink weights describe the diagonal cut. Use the current-color version for dark and light surfaces. Geist carries the editorial type and controls. Reserve monospace for code and small navigation labels.

## Layout

Use fog panels and spacing for related content. Keep surfaces free of decorative borders and divider rules, including dropdowns, FAQs, form fields and release lists. Retain visible keyboard focus indicators, high contrast fallbacks and strokes that form an icon. Keep article text within a comfortable reading measure.

## Motion

The hero dots drift together and return to their original coordinates. The header and footer use the supplied Micro-Dot Cut loop while their marks are visible. Use the shared text-reveal component for display headings and short editorial passages. Ordinary reading text stays in the document flow. All effects follow the operating system’s reduced-motion preference. See the [website guide](website.md) for edition and content setup.

The HTML includes all content before animation. An early enhancement flag allows a quiet first frame, then IntersectionObserver reveals content in small staggered groups using opacity and transforms. Offscreen groups stay quiet until approached. Keyboard focus and anchor navigation reveal their destination immediately. Reduced motion, printing, forced colors and JavaScript failure keep content available. The early flag fails open after 1.8 seconds if the entrance module cannot initialize.

The Apps and Docs disclosures use panels anchored to the masthead. Apps has a quiet introduction and a horizontal scroll-snap carousel of the full catalog, with two cards visible on larger screens and one on smaller screens. Touch, mouse dragging, previous/next buttons and keyboard arrows/Home/End reach every app. There is no dropdown search field, category list or numbered Browse all footer. Carousel controls load on menu intent. Docs uses compact headings with links for every app, without product cards or placeholder descriptions. Its three columns become two on smaller screens and one on phones, inside a bounded, scrollable panel. Each app has its own dot symbol and tile: Hub mint, Share blue, Bucket sand, Cast coral, Seek warm orchid and Ledger lemon. Preserve the supplied family assets; they remain the family identity rather than the Share app icon.

Dropdown opacity and position are reversible on interrupted toggles. Height transitions measure the content and start from the current rendered height when content changes or menus switch, so a smaller panel settles without snapping. Both animations are cancelled cleanly under reduced motion. Native disclosure and horizontal scrolling remain usable without JavaScript.

The appbar entrance is retired after it completes or receives focus, so losing focus cannot restart the fade. Carousel endpoint buttons hand focus back to the scroll area before becoming disabled. Enhanced swipes keep CSS snapping off and ease from the released position; track height changes wait until the gesture settles. Native snapping remains the fallback without JavaScript.

The app directory uses compact branded cards in three columns on desktop, two on tablets and one on phones. Each card has one full-card link, a moderate heading, short description and platform line. Hidden catalog items must remain hidden when filtering the grid.

Keep native details/summary as the no-JavaScript fallback. With enhancement, animate the panel on both opening and closing; keep the native panel rendered until its exit finishes. Closing content immediately becomes inert and hidden from accessibility APIs. Reverse interrupted motion from its current appearance, keep only the intended panel interactive, support Escape and outside focus/click dismissal, and settle immediately for reduced motion. Animate only the panel, preserving the masthead's glass and docking transitions.

The masthead’s children fade in independently of page reveal targets. Never animate opacity on the row containing its glass pseudo-element, or retain an opacity animation with forwards/both fill: that can isolate the backdrop and leave page text sharp underneath. Keep the original compact mobile transformation and desktop width transition. Discovery surfaces show at most four featured cards, with category/search navigation into the full catalog as it grows. At tablet and mobile widths, menu cards become horizontal rows in one column. The complete app/download catalogs support linkable search, category filters and clear empty states; menus do not grow with every new item.

App overviews use a short section heading, body text, a compact workflow, app FAQs and paired Documentation/Downloads cards. Do not set the introduction paragraph in display type or decorate cards with generic development badges. Show actual build availability on the download page. Never add a logo pause button. Product marks offer explicit `static`, `once` and `loop` modes: use loops in the large app hero, short introductions on app cards and app-edition signatures, and static marks in navigation. All animated modes stop offscreen, when the document is hidden and for reduced motion. Inline variant styles and keyframe names must be isolated so one-time and looping versions can coexist.

App hero backgrounds use the same noise shader and grain fallback as Downloads through `Field variant="downloads"`. Keep the background consistent, including before JavaScript loads or when WebGL and motion are unavailable. The worker paints the bounded texture on demand instead of running a continuous animation loop.

The footer uses a static version of that noise shader at 30% opacity over its original dark surface. The user explicitly removed animation from this effect: do not add drift, looping or time-based shader updates. Cap the texture at 512px on either axis and paint it on demand when visible or resized. Retain static grain for reduced motion and unavailable WebGL, and omit the effect in print and forced colors. Keep footer text and links stationary and readable.

Interactive elements and groups containing controls reveal with opacity while keeping their hit targets stationary. Focus must not cancel a translation halfway through a pointer click. Noninteractive copy can still move gently into place.
