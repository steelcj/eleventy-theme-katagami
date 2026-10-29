The spec is updated to v0.5.0 in en/docs/dev/katagami-theme-goals.md and records the phase 2 decisions. Re-read it before starting.

Before phase 3, finish phase 2:

1. Retest watch mode: change a page's order, add a page to a folder, and add an index.md to a new folder; navigation and breadcrumbs must update without a restart.
2. Check the navigation markup against the spec: each nav has its own aria-label, aria-current="page" in breadcrumbs and section nav, aria-current="true" on the current main-menu section, breadcrumbs as an ordered list with the separator generated in CSS.
3. Add a build warning for a directory of pages without an index.md.
4. Region lists: when a folder and a page both add to a region, folder parts come first, then page parts, with duplicates removed.
5. Confirm the production build hides ar from the language switcher on every page, not only the chooser at /.
6. Commit phase 1 and phase 2 separately if they can still be separated; otherwise commit them together.

Answers to your questions:

1. Main menu: top-level items only, children in the sidebar section nav. No header dropdowns in version 1.
2. On a folder's own page, section nav shows the folder's ancestors and siblings without expanding its children.
3. Version 1 blocks: text, image, teaser, listing, grid and call to action. Embed is deferred.
4. Unknown block types: visible placeholder and console warning in development, failed build in production.

Then build phase 3, blocks and views, as described in the spec. Sveltia field definitions for blocks wait for phase 5. For the image block, propose how images are processed for low bandwidth (sizes, formats, lazy loading) before implementing it, and wait for my decision. Stop for review at the end of phase 3 as before.
