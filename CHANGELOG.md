# Changelog

All notable changes to this project are recorded here. The format follows Keep a Changelog, and versions follow Semantic Versioning.

## [Unreleased]

## [0.5.0] - 2026-10-29

Phase 5: reader preferences.

### Added

- Fluid Infusion UI Options in a panel below the header, opened by a Preferences button, for text size, line spacing, fonts and contrast. Infusion 4.8.0 is copied into `assets/vendor/infusion/` by `npm run vendor-infusion` at the version pinned in `theme.yaml`, and loads only when a reader first opens the panel.
- Enactors that map the preferences onto the theme's tokens: text size on the root font size, line spacing on the baseline unit, fonts on the font set's stylesheet, and contrast on a `data-contrast` attribute.
- Contrast that follows the reader's device by default, with the site's colours, a high-contrast scheme and a dark scheme as choices. `prefers-color-scheme: dark` and `prefers-contrast: more` choose the schemes without JavaScript, and `prefers-reduced-motion` turns off animation.
- A local storage store for UI Options: preferences are kept under `katagami-preferences` as `{ "version": 1, … }` with only non-default values, applied before the page is drawn by a static head script, cleared by reset, and safe when storage is blocked. The phase 4 `katagami-font-set` choice moves into it once.
- `assets/csp.json`, written at each build, with the minimum Content Security Policy the site works under: `default-src 'self'`, with `script-src` allowing the head script by hash and `style-src` the one style Infusion's core adds, also by hash. No `'unsafe-eval'` or `'unsafe-inline'`. `npm run check` confirms every page's inline script matches, and `npm run check:browser` opens the panel under the policy and fails on any violation.
- The panel's button has the theme's own fixed label, "Display preferences", "Préférences d’affichage" and an Arabic label, with `aria-expanded` for its state; Infusion's `aria-pressed` and changing labels are removed.
- When Infusion fails to load, the button shows a short, translated message, a status message announces it, and the page is unaffected; clicking again retries.
- Accessibility audits with axe-core 4.14.0 in `npm run check:browser`: home pages, text pages and pages with images in English, French and Arabic, under the site's colours, high contrast and dark, and with the panel open. All pass with no violations.
- `npm run vendor-infusion` copies the licences of Infusion and of jQuery and fastXmlPull, bundled in the UI Options build, with Infusion's authors file, into `assets/vendor/infusion/licenses/`.
- Messages for the theme's font set and contrast choices in English, French and Arabic, and Arabic messages for the whole panel, in `i18n/preferences/`.
- `npm run check:browser` tests the panel: loading on demand, each preference and what is saved, saved preferences on the next page, reset, the move from the old key, blocked storage, system settings and explicit choices, the French and Arabic panels, and the vertical rhythm at larger text and line spacing.

### Changed

- The phase 4 font select and `font-preference.js` are replaced by the preferences panel.
- The baseline is rounded to a whole pixel, and block spacing in the text flow is in baselines, so the grid holds at any text size and line spacing.
- Buttons and link hover colours use semantic colour tokens, so they follow the contrast schemes.
- The breadcrumb separator is an SVG file instead of a `data:` URL, so a Content Security Policy needs nothing beyond `'self'` for images.

### Specification

The specification is now version 0.7.0: it records the reader preferences as built, the minimum Content Security Policy, the panel button's fixed label and failed-load message, the accessibility audits, the note that upgrading Infusion requires rerunning the browser checks, and the panel's Arabic strings on the Arabic reader's review list. Phase 5 is marked done.

### Fixed

- Link text on hover and the call-to-action button's hover colour now meet WCAG AA contrast (5.2:1); the persimmon accent was 4.0:1 against the background.

## [0.4.0] - 2026-10-28

Phase 4: font sets and the type system, and preparation.

### Added

- Three font sets, chosen from the specimens on the `specimens` branch: Hyperlegible (Atkinson Hyperlegible Next with IBM Plex Sans Arabic), Mincho (Shippori Mincho headings, Atkinson Hyperlegible Next body, Noto Naskh Arabic) and Gothic (Zen Kaku Gothic New headings, Atkinson Hyperlegible Next body, IBM Plex Sans Arabic). Each is one generated CSS file in `assets/css/fonts/` with its fonts' `@font-face` rules, Arabic companion included, and the `--font-heading` and `--font-body` tokens.
- Self-hosted WOFF2 fonts in `assets/fonts/`, 400 and 700 weights of the Latin, Latin Extended and Arabic subsets only, each with its `OFL.txt`, copied from Fontsource packages by `npm run vendor-fonts` and `scripts/vendor-fonts.mjs` from the `fonts` and `fontSets` lists in `theme.yaml`, without adding the packages as dependencies.
- The site's font set from `fontSet` in `site.yaml`. Each page loads only that set's CSS and preloads one font file: the body font's regular weight, or the Arabic companion's in a locale with `fontSet: arabic`.
- A `ui-options` part in the header that lets readers choose a font set, with `assets/js/font-preference.js`. The control appears only with JavaScript; the choice is kept in local storage and applied by a short script in the page head before the page is drawn.
- `npm run check` requires one font set stylesheet and one existing preloaded font on every page.
- The type system: a modular scale with a ratio of 1.25 computed from a `--ratio` token; vertical rhythm from one 0.375rem baseline, with every line height and vertical text margin a whole number of baselines, including Arabic's larger lines and taller headings; `text-wrap: pretty` extended to captions, quotations and table cells; tabular figures in tables; small caps in table headings only where a font has them, with faux small caps disabled.
- Locale-aware typography in `themes/katagami/typography.js`, a markdown-it plugin: quotation marks for the page's language, and French spacing by locale tag, Quebec's for `fr-CA` and France's for other French tags, never in code, URLs or times. A `typeset` filter applies the same rules to titles, descriptions, headings, card text, breadcrumbs and section navigation.
- A `tag` field for locales, such as `fr-CA`, exposed to pages as `langTag` and used for the `lang` attribute, `hreflang`, dates and typography, while folders and URLs keep the short `code`. The fixture's French locale is `fr-CA`.
- A French typography fixture at `/fr/fixtures/typographie/`, with `npm run check` comparing its output, and checks of France's conventions on the spacing function itself.
- `npm run check:browser` and `scripts/check-browser.mjs`, which test the built site in Playwright's Chromium, installed with `npx playwright install chromium`: the font set switch and its persistence, the page without JavaScript, which fonts each page downloads, and the vertical rhythm of a text page in every font set. `npm run check` stays browser-free.
- `scripts/vendor-fonts.mjs` refuses a version range and confirms each fetched package is the pinned version.
- Titles and descriptions are plain text everywhere they appear, including the page title, meta description and navigation labels: smart punctuation and French spacing, but no Markdown and no HTML. A fixture at `/en/fixtures/titles/` checks this.
- `npm run check` requires every page in a language folder to carry its locale's full tag, such as `lang="fr-CA"`, and every `hreflang` to be a full tag.
- Images in the text flow keep the baseline grid: the theme reads each image's proportions from `src/media/` with sharp before the build, gives it a ratio class, writes `assets/css/image-ratios.css`, and rounds the image's height up to a whole baseline, so the text after it returns to the grid. Card images and thumbnails are rounded the same way.
- An Arabic typography fixture at `/ar/fixtures/typography/`. The browser rhythm check now covers Arabic and pages with images, cards, albums, summaries and tables, in every font set at phone and desktop widths, with no allowance beyond sub-pixel rounding.
- Stubs for layouts that only the site has, in `site/layouts/`.
- `site/index.js`, an optional extension point for site-only build code, added as a plugin after the theme when present. It must not set directories.
- `npm run fixture-images` and `scripts/make-fixture-images.mjs`, which regenerate the fixture images byte for byte.
- Base table styles, so tables in Markdown have cell spacing and rules.
- Markdown table column alignment as a `data-align` attribute (start, center or end) styled with logical CSS, instead of markdown-it's inline `text-align` styles, so columns mirror in right-to-left pages. Fixtures in `en/fixtures/tables` and the Arabic mixed-direction page.
- `npm run check` reports any inline style attribute.
- `.claude/settings.json` with the project's command permissions; `.claude/settings.local.json` and `resume.txt` are ignored.

### Changed

- Language names in the language switcher and chooser are set in a system font stack, so no page downloads a web font just to show another language's name.
- Paragraphs, lists, tables and blocks are spaced in whole lines of the baseline grid instead of fixed rem values.
- Rules on cards, list and summary items, table cells, code blocks and unknown-block placeholders are drawn as outlines or inset shadows, which take no space.
- `sharp` is a runtime dependency, since the theme reads image proportions with it.
- Section navigation does not render when every page in the section is hidden from navigation.
- `block-list`, `picture` and `lead-image` moved from `parts/` to a new `partials/` folder, so `parts/` holds only items placed in regions.
- stylelint 17 and `stylelint-config-recommended` 18, with the same logical-property rules.
- `sharp` is a direct development dependency, used by the fixture image script.

### Fixed

- Teaser images run to the card's edges again; a block's first-child margin rule had overridden the card's image bleed.
- On Arabic pages the Arabic line height no longer overrides heading line heights.
- The colophon's "Theme:" label follows French spacing.
- Summary thumbnails and inline code no longer add a pixel to their lines.

### Specification

The specification in `en/docs/dev/katagami-theme-goals.md` is now version 0.6.0:

- `site/index.js` is documented as an optional extension point that runs after the theme plugin and must not set directories, and site-only layouts get stubs.
- `partials/` is added to the theme directory.
- The font set table records the chosen fonts, with Atkinson Hyperlegible Next for body text in every set, and the three font questions are closed; the Arabic one still asks for an Arabic reader's review before the `ar` locale leaves fixture status.
- Each font set's CSS includes its Arabic companion, so there is no separate `arabic.css`.
- The type system is described in full: modular scale, measure, vertical rhythm, wrapping, smart punctuation by language, French spacing by locale tag (Quebec for `fr-CA`, France for `fr` and `fr-FR`), and OpenType numerals and small caps where the fonts offer them.
- Locales gain a `tag` field, and the fixture's French locale is `fr-CA`.
- A new phase 5, Reader preferences, integrates Fluid Infusion UI Options for fonts, contrast, text size and line spacing; Sveltia and fences become phases 6 and 7.
- Titles and descriptions are plain text everywhere, including the JSON index and accessible labels.
- An Arabic reader's review is a checklist: the companion fonts, the inner quotation marks ‹ ›, the digits and the fixture's Arabic text.

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
