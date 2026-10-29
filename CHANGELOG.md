# Changelog

All notable changes to this project are recorded here. The format follows Keep a Changelog, and versions follow Semantic Versioning.

## [Unreleased]

Phase 4 preparation.

### Added

- Font specimen pages in `en`, `fr` and `ar` for the Hyperlegible, Mincho and Gothic font sets, on the `specimens` branch only. Each sets the same text (headings, a heading-size line of curly quotes and apostrophes on the Mincho pages, body text, easily confused letters, numerals, a table and mixed-direction text) once in each candidate: Atkinson Hyperlegible and Atkinson Hyperlegible Next, Shippori Mincho and Zen Old Mincho, BIZ UDPGothic and Zen Kaku Gothic New, and the Arabic companions Noto Naskh Arabic, IBM Plex Sans Arabic and Vazirmatn. The candidates come from Fontsource packages, through `site/index.js`.
- Stubs for layouts that only the site has, in `site/layouts/`.
- `site/index.js`, an optional extension point for site-only build code, added as a plugin after the theme when present. It must not set directories.
- `npm run fixture-images` and `scripts/make-fixture-images.mjs`, which regenerate the fixture images byte for byte.
- Base table styles, so tables in Markdown have cell spacing and rules.
- Markdown table column alignment as a `data-align` attribute (start, center or end) styled with logical CSS, instead of markdown-it's inline `text-align` styles, so columns mirror in right-to-left pages. Fixtures in `en/fixtures/tables` and the Arabic mixed-direction page.
- `npm run check` reports any inline style attribute.
- `.claude/settings.json` with the project's command permissions; `.claude/settings.local.json` and `resume.txt` are ignored.

### Changed

- Section navigation does not render when every page in the section is hidden from navigation.

- `block-list`, `picture` and `lead-image` moved from `parts/` to a new `partials/` folder, so `parts/` holds only items placed in regions.
- stylelint 17 and `stylelint-config-recommended` 18, with the same logical-property rules.
- `sharp` is a direct development dependency, used by the fixture image script.

## [0.3.0] - 2026-10-28

Phase 3, blocks and views.

### Added

- Six block types, each one partial in `blocks/`: text, image, teaser, listing, grid and call to action. Blocks are listed in a page's front matter and rendered after its Markdown body, with headings one level below their container.
- Four views in `views/` for folders and listing blocks: listing, summary, tabular and album. A folder chooses one with `view` and orders its pages with `sort`.
- Unknown block types and views show a placeholder and a warning in development and fail a production build, with the block or view named in the error.
- Images processed at build time with `@11ty/eleventy-img`: AVIF, WebP and the original format at 320, 640, 960 and 1280 pixels, with `sizes` rules for content, cards and thumbnails, `width` and `height`, and lazy loading except for the page's first image. Processed files are cached in `.cache/katagami/img/`, and original uploads are no longer published.
- A lead image field, `image`, used on the page and by teasers, summaries and albums. Alt text is required unless an image is marked decorative.
- Warnings for raw HTML in block fields, links to pages that do not exist, listings of folders that do not exist, and missing image files.
- Dates formatted for each language with `Intl.DateTimeFormat`.
- `sort: date-asc`, soonest first, for upcoming events, used by the workshop listings; `sort: date` stays newest first.
- A build warning for a JavaScript data file that sets `regionOverrides`, which the theme reads only from YAML, JSON and front matter.
- `npm run check`, which checks the built pages for language and direction, navigation labels and current items, breadcrumb markup, image attributes, empty regions and unknown blocks, and compares fixture pages with their expected regions.
- A nested-folder fixture under `src/en/fixtures/`, where a folder, a subfolder and a page add parts to the same region.
- Fixtures: blocks on every home page, an album, a table of dated workshops, image blocks and lead images, generated from three stencil patterns. Node.js 24 is used for development.

### Changed

- Section navigation does not open the current page, so on a folder's own page it shows the folder's ancestors and siblings, and it does not appear on a top-level section's own page.
- A region is left out of the page when its parts render nothing, so there are no empty landmarks.
- The text measure applies to text elements instead of the whole content column, so grids, tables and albums use its full width.
- Node.js 22 or later is required.

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
