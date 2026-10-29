# Katagami

Katagami is a Plone-inspired theme for Eleventy with a vintage Japanese, minimalist style, built by Vishpala. This repository holds the theme in `themes/katagami/` and a demo and fixture site in `src/`, which doubles as the theme's test suite. The full specification is in [en/docs/dev/katagami-theme-goals.md](en/docs/dev/katagami-theme-goals.md).

## Getting started

Katagami needs Node.js 22 or later, for the image pipeline; `.nvmrc` selects Node 24 for nvm users.

```sh
npm install
npm start          # serve at http://localhost:8080 and rebuild on change
npm run build      # build all locales into _site/
npm run lint       # stylelint, including the logical-property rule
npm run check      # check the built pages in _site/ against the theme's markup rules
npm run check:browser   # check the built site in a real browser (see below)
npm run fixture-images  # regenerate the stencil-pattern images in src/media/
npm run vendor-fonts    # copy the fonts listed in theme.yaml and regenerate the font set CSS
npm run vendor-infusion # copy Fluid Infusion UI Options, at the version in theme.yaml
```

`npm run build:production` builds with `ELEVENTY_ENV=production`, which leaves fixture locales such as `ar` out of the language switcher. The fixture pages are still built.

`npm run check` reads the built HTML only. `npm run check:browser` loads the built site in the Chromium that Playwright installs, never the system browser, and checks the reader preferences panel, the panel under the site's Content Security Policy and when Infusion fails to load, the reader's system settings, accessibility with axe-core under the site's colours, high contrast and dark in all three languages, which fonts each page downloads, the vertical rhythm, and the page without JavaScript. Install that browser once with `npx playwright install chromium`.

## Layout

- `eleventy.config.js` sets the directories and loads the theme plugin.
- `src/` is Eleventy's input and holds site content only: one folder per language (`en`, `fr`, `ar`), global data in `src/_data/`, and `src/admin/` and `src/media/`, which are copied to the output unchanged.
- `src/{lang}/_site/` holds the per-language site text, `footer.md` and `colophon.md`. These files are placed into the footer region and never published as pages.
- `themes/katagami/` is the theme: manifest, plugin, layouts, parts (the items placed in regions), partials (pieces shared by layouts, blocks and views), blocks, views, defaults, interface strings and assets.
- `site/` holds site overrides. A file here shadows the theme file with the same path, so `site/parts/colophon.njk` replaces `themes/katagami/parts/colophon.njk`. A layout that only the site has, in `site/layouts/`, gets a stub too.
- `site/index.js` is an optional extension point for site-only build code, such as extra data, filters or pages. When it exists, the theme plugin adds it as a plugin after registering everything else, so it can rely on the theme's loader, filters and data. It must not set directories, which belong to `eleventy.config.js`.
- `scripts/` holds `check-pages.mjs` and `check-browser.mjs`, run by `npm run check` and `npm run check:browser`, `make-fixture-images.mjs`, which generates the fixture images, and `vendor-fonts.mjs` and `vendor-infusion.mjs`, which copy the theme's fonts and Fluid Infusion.
- `en/docs/` is project documentation and is never built.

## Overriding the theme

Templates are resolved by a Nunjucks loader that searches `site/` first, then `themes/katagami/`. To change a part or a layout, copy it from the theme to the same path under `site/` and edit the copy. Layouts are reached through one-line virtual stubs, so a `site/layouts/page.njk` takes the place of the theme's `page.njk` everywhere.

Regions are filled from data. `src/_data/regions.yaml` lists the parts in each region (header, abovecontent, sidebar, belowcontent and footer), and any region it leaves out falls back to `themes/katagami/defaults/regions.yaml`.

A folder or page adjusts regions with `regionOverrides`, following Plone's portlet inheritance. A folder sets it in its directory data file, such as `services/services.11tydata.yaml`, and the setting applies to everything beneath it; a page sets it in front matter.

| Value for a region | Effect |
| --- | --- |
| A list of parts | Adds those parts to what the folder above provides |
| A single part name | Replaces the region with that one part |
| `none` | Empties the region |

```yaml
regionOverrides:
  sidebar: none
  footer: [contact-strip]
```

Settings apply from the site down: the site's regions, then each folder's, then the page's. When a folder and a page both add to a region, the folder's parts come first and a part listed by both appears once. The theme reads these settings from YAML and JSON data files and from front matter. A JavaScript data file that sets `regionOverrides` is reported with a build warning, since the theme does not read it. The fixture under `src/en/fixtures/` tests a folder, a subfolder and a page adding to the same region.

In watch mode, edited and newly added override files are picked up straight away. A deleted override takes effect on the next change to any watched file, because Eleventy 3.1 does not rebuild when a file is deleted.

## Folders and navigation

A folder is a directory plus its `index.md`, which holds the folder's title, description and introduction. The build warns about a folder of pages without an `index.md`, since its pages would attach to the folder above. Every page in a language folder joins a navigation tree whose root is that language's home page; a page's parent is the nearest folder above it with an `index.md`. Breadcrumbs follow the tree, with the separator drawn in CSS so that screen readers skip it, and the section navigation in the sidebar shows the current top-level section, opened down to the current page.

The main menu is curated in `src/_data/navigation/{lang}.yaml`. The item for the section a page is in is marked as current.

Pages have three navigation fields:

- `menuTitle`, a short title for menus and breadcrumbs, defaulting to `title`.
- `order`, the position among the folder's children.
- `excludeFromNav: true`, which leaves the page out of menus. It still appears in its folder's listing.

## Languages and translations

The site root `/` is a language chooser, built by the theme unless `src/` has its own `index` page. The language switcher links to the current page in each language. Pages are translations of each other when they share a `translationKey`, which defaults to the URL without its language prefix, so `/en/services/` and `/fr/services/` match without any setting. A translation with a different slug sets the key of the page it translates, for example `translationKey: /services/design/` in `fr/services/conception.md`. When a language has no translation, the switcher links to its home page.

Each locale in `src/_data/locales.yaml` has a `code`, which names its folder and URL prefix, and may have a `tag`, its full language tag. The fixture's French is `{ code: fr, tag: fr-CA }`: pages live under `/fr/`, while the `lang` attribute, dates and typography follow `fr-CA`. Language names in the switcher and chooser are set in system fonts, so no page downloads a web font just to show another language's name.

## Blocks and views

A page lists its blocks in front matter. Blocks render after the page's Markdown body, never inside it, so to put text between two blocks, editors use a text block rather than the body. Version 1 has six block types:

| Type | Fields |
| --- | --- |
| `text` | `heading`, `body` (Markdown) |
| `image` | `src`, `alt` or `decorative: true`, `caption` |
| `teaser` | `link`, and optionally `title`, `description` and `image`, which default to the linked page's own |
| `listing` | `folder` (defaults to the page's own), `view`, `sort`, `limit`, `heading` |
| `grid` | `blocks`, `columns` (2, 3 or 4), `heading` |
| `call-to-action` | `heading`, `body` (Markdown), `label`, `link` |

```yaml
blocks:
  - type: text
    body: A short introduction.
  - type: grid
    columns: 3
    blocks:
      - type: teaser
        link: /en/services/design/
```

Listings sort by `order` (the default), `title`, `date` (newest first) or `date-asc` (soonest first, for upcoming events). A folder's `index.md` shows its pages with a view, set with `view` and `sort` in its front matter: `listing` (titles and descriptions, the default), `summary` (with dates and thumbnails), `tabular` (a table) or `album` (cards with images). A listing block uses the same views.

An unknown block type or view shows a placeholder and a warning in development, and fails a production build.

## Images

Images live in `src/media/` and are processed at build time: every image becomes a `<picture>` with AVIF, WebP and the original format, at widths of 320, 640, 960 and 1280 pixels, never enlarged. Each has `width` and `height`, and loads lazily except the page's first image, its lead image or first image block, which loads at once. Only processed files are published, under `/media/img/`, and they are kept in `.cache/katagami/img/` so later builds do not encode them again.

A page's lead image is its `image` field, `{ src, alt }`, which teasers, the summary view and the album view also use. Every image needs `alt` text unless it is marked `decorative: true`; a missing alt text or image file warns in development and fails a production build.

## Fonts

The theme has three font sets. Atkinson Hyperlegible Next sets body text in all of them; the sets differ in their headings and Arabic companion.

| Font set | Headings | Body | Arabic |
| --- | --- | --- | --- |
| `hyperlegible` | Atkinson Hyperlegible Next | Atkinson Hyperlegible Next | IBM Plex Sans Arabic |
| `mincho` | Shippori Mincho | Atkinson Hyperlegible Next | Noto Naskh Arabic |
| `gothic` | Zen Kaku Gothic New | Atkinson Hyperlegible Next | IBM Plex Sans Arabic |

The site picks its set with `fontSet` in `src/_data/site.yaml`, `hyperlegible` by default, and readers can choose another in the preferences panel. Each page loads only its set's CSS and preloads one font file: the body font's regular weight, or the Arabic companion's on pages in a locale with `fontSet: arabic`.

The fonts are self-hosted WOFF2 files under the SIL Open Font License, in `themes/katagami/assets/fonts/`, with each font's licence in its `OFL.txt`. Only the 400 and 700 weights of the Latin, Latin Extended and Arabic subsets are kept, and each subset downloads only when a page uses its characters. To change a font, edit `fonts` and `fontSets` in `theme.yaml` and run `npm run vendor-fonts`, which fetches the Fontsource packages without adding them as dependencies. Versions in `theme.yaml` must be exact, such as `5.3.0`; the script refuses a range.

## Reader preferences

A "Display preferences" button in the header opens a panel, Fluid Infusion UI Options, where readers adjust text size, line spacing, fonts and contrast. Contrast follows the reader's device by default, and offers the site's colours, high contrast and dark. Infusion is self-hosted and loads only when a reader first opens the panel.

- Without JavaScript the button is hidden; the site's settings apply, and the reader's system settings choose dark or high-contrast colours and turn off animation.
- The button's label stays the same, "Display preferences", "Préférences d’affichage" or "تفضيلات العرض"; `aria-expanded` tells whether the panel is open.
- If Infusion cannot load, the button shows a short message in the page's language, such as "Preferences couldn’t load", a status message announces it to screen readers, and the rest of the page is unaffected. Clicking again tries once more.
- Preferences are kept in the browser's local storage under `katagami-preferences`, as `{ "version": 1, … }` with only the values that differ from the defaults, and apply before the page is drawn. No cookie is used. Reset clears them.
- The panel's strings, for its button, the theme's own choices, and Arabic for the whole panel, are in `themes/katagami/i18n/preferences/`.

### Content Security Policy

The site works, preferences panel included, under this minimum policy, which each build writes to `_site/assets/csp.json` with the current hashes:

```text
default-src 'self'; script-src 'self' 'sha256-…'; style-src 'self' 'sha256-…'
```

- Everything, scripts, styles, fonts, images and the panel's templates and messages, loads from the site itself, so `'self'` covers it.
- The script hash is that of the site's only inline script, the one in the page head that applies saved preferences.
- The style hash is that of the one `<style>` element Infusion's core adds when it loads. It styles classes the theme does not use, so blocking it changes nothing, but allowing it keeps the policy free of violation reports.
- Infusion needs no `'unsafe-eval'` and no `'unsafe-inline'`. Styles it and the theme set from scripts, such as the text size, go through the CSS object model, which a policy does not restrict.
- `npm run check:browser` opens the panel under this policy and fails on any violation.

### Upgrading Infusion

Change `preferences.infusion` in `themes/katagami/theme.yaml`, run `npm run vendor-infusion`, then `npm run build` and `npm run check:browser`. The theme re-registers Infusion's font and contrast schemas, `fluid.prefs.schemas.textFont` and `fluid.prefs.schemas.contrast`, and relies on the names of its panels, messages and events, so a new version must pass the browser checks before it is used. The style hash in the policy is recomputed from the new build.

## Typography

- **Scale and rhythm.** Type sizes are steps of a modular scale with a ratio of 1.25. Every line height and vertical margin between blocks of text is a whole number of 0.375rem baselines, so text keeps to one grid down the page. Images keep their proportions, with their height rounded up to a whole baseline, and rules are drawn without taking space, so the text after an image, a card or a table returns to the grid. `npm run check:browser` checks this in Latin and Arabic text, on pages with and without images, in every font set at phone and desktop widths.
- **Plain titles.** Titles and descriptions are plain text everywhere: they get smart punctuation and French spacing, but Markdown in them is not rendered and HTML is shown as text.
- **Quotation marks.** Straight quotes typed in Markdown, and in titles and descriptions, become the marks of the page's language: “ ” in English, « » with non-breaking spaces in French, « » in Arabic. Apostrophes become ’.
- **French spacing.** French pages follow their locale's tag. `fr-CA` uses Quebec's conventions, a non-breaking space before a colon and no space before ; ! ?; other French tags use France's, a narrow non-breaking space before ; ! ? and a non-breaking space before a colon. Both put non-breaking spaces inside « ». Editors can type spaces or not; the theme sets them. Code, URLs and times such as 12:45 are left alone. The fixture at `/fr/fixtures/typographie/` shows each rule.
- **Numerals and small caps.** Tables use tabular figures, so numbers line up. Table headings ask for small caps, which appear only in fonts that have them; none of the current fonts does, and the theme never draws faux small caps.

## Content rules

Content is written in Markdown. Raw HTML is shown as text rather than rendered, and the build warns about it with the file and line. Template syntax in Markdown is never executed.

## Licence

The code is released under the MIT licence; see [LICENSE.md](LICENSE.md).
