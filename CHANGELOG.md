# Changelog

All notable changes to this project are recorded here. The format follows Keep a Changelog, and versions follow Semantic Versioning.

## [0.2.0] - 2026-10-28

Phase 2, folders, navigation and breadcrumbs.

### Added

- A navigation tree built with Eleventy Navigation. The theme gives every page in a language folder a key from its path and a parent from the nearest folder `index.md`, so the site needs no navigation data file.
- Navigation fields for editors: `menuTitle`, `order` and `excludeFromNav`.
- Breadcrumbs from the language's home page to the current page, as an ordered list with the separator drawn in CSS, so it mirrors in right-to-left pages and is not announced by screen readers.
- A `sidebar` region at the inline end, holding a new `section-nav` part that shows the current top-level section opened down to the current page.
- The main menu marks the item for the current section with `aria-current="true"`. Production builds hide fixture locales from the language switcher on every page.
- `regionOverrides` in folder data files and front matter, inherited as Plone portlets are: a list adds parts, a part name replaces the region, and `none` empties it. When a folder and a page both add to a region, folder parts come first and duplicates are removed.
- A build warning for a folder of pages without an `index.md`.
- Translation links: the language switcher links to the same page in each language through a shared `translationKey`, defaulting to the URL without its language prefix, and falls back to the language's home page.
- A language chooser at `/`, registered by the theme from `templates/languages.njk`, which leaves fixture locales out in production builds.
- Fixtures: a `workshops` folder inside `services` in every language, an English page hidden from navigation without a sidebar, and French pages whose slugs differ from their English translations.

### Changed

- `section.njk` lists a folder's children from the navigation tree instead of matching URLs.
- The grid gives the stretch to the row above the footer, so the sidebar follows the content directly on narrow screens.

## [0.1.0] - 2026-10-28

Phase 1, the skeleton.

### Added

- Repository setup: `package.json` (ESM, Eleventy 3.1), `.gitignore`, README, licence, changelog, and npm scripts `build`, `build:production`, `start` and `lint`.
- Site override pattern: `eleventy.config.js` sets `src/` as input, an empty `src/_includes`, a virtual `_layouts` directory and watch targets for `site/` and `themes/katagami/`. The theme plugin registers a Nunjucks loader that searches `site/` before `themes/katagami/` with caching off, a virtual layout stub for each theme layout, and asset passthrough to `/assets/`.
- Theme skeleton in `themes/katagami/`: `theme.yaml` manifest, `base.njk` with header, abovecontent, content, belowcontent and footer regions filled from region data, `page.njk` and `section.njk`, parts for skip links, logo, main navigation, language switcher, breadcrumbs, footer text, site actions and colophon, default regions, and interface strings in English, French and Arabic.
- Theme CSS split into tokens, base, grid and components, using logical properties only, with an asymmetric region grid that mirrors in right-to-left pages and system fonts.
- Fixture site in `src/` with `en`, `fr` and `ar` home pages, a services section with two pages per language, per-language footer and colophon text, and an Arabic page mixing Arabic with English product names, URLs, numbers and code.
- `ar` as a right-to-left fixture locale, left out of the language switcher in production builds.
- An override in `site/parts/colophon.njk` that proves shadowing works.
- Markdown with raw HTML escaped, the template engine disabled for Markdown, and code and bare URLs kept left-to-right.
- Stylelint with rules rejecting physical properties and values, and an Eleventy linter that warns about raw HTML in Markdown with its file and line.
