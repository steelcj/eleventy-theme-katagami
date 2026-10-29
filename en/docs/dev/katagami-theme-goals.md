---
title: "Katagami Theme: Goals"
description: "Goals, repository layout, theme directories, typography, directionality and open decisions for Katagami, a Plone-inspired Eleventy theme for Vishpala websites."
date: 2026-10-29
version: 0.8.0
lang: en
author: Christopher Steel
---

# Katagami Theme: Goals

## Purpose

Katagami is a reusable, Plone-inspired theme for Eleventy with a vintage Japanese, minimalist visual style. Every Vishpala site starts from the same defaults for header, footer, page regions, grid layout and typography. Content lives in Markdown and data files that editors can manage through a Git-based CMS once the CMS adapter, deferred for now, is built; presentation lives only in the theme. One site differs from another by its content and a small set of overrides, never by a fork of the templates.

The name comes from katagami, the paper stencils used to print patterns onto kimono fabric. The stencil carries the design and the cloth carries the substance, which is the separation of content and presentation this theme is built on.

The Plone ideas we borrow are content types defined as schemas, reusable field groups (behaviors), named page regions filled from data (viewlet managers), an editable footer (footer portlets), folders with their own properties and default page, saved queries with selectable display views, and structured blocks for page layout (Volto).

## Goals

- **A theme repository with its own test site.** The repository `eleventy-theme-katagami` holds the theme in `themes/katagami/` and a demo and fixture site in `src/`, which doubles as the theme's test suite. Only `src/` is Eleventy's input; the theme, site overrides and project documentation sit beside it.
- **A fixed, documented theme directory structure.** Every theme has the same required directories, so tooling, documentation and editors can rely on them.
- **Strict separation of content from presentation.** Content may contain text formats (Markdown, Mermaid, CSV) but not presentation formats (HTML, CSS, class names). Templates, partials, styles and scripts live only in the theme.
- **Header, footer and named regions as defaults.** One base layout defines regions: header, above content, content, below content, sidebar and footer. What fills each region is data, inherited down the folder tree and adjustable per folder or per page.
- **Simple editing for non-technical creators.** Site-wide text such as the footer, an announcement banner and the colophon is written as short Markdown files, one per language. Editors fill in fields and write prose; they never touch layout or markup.
- **Folders that are directories.** A folder is a directory plus its `index.md`. Navigation, breadcrumbs, section listings and inherited settings all follow from that one convention.
- **Grid layout through blocks.** Pages are composed of typed blocks (text, image, teaser, listing, grid, call to action in version 1), each rendered by one theme partial, with CSS Grid doing all layout.
- **Content types with reusable behaviors.** Each content type has a default layout, and will map to a CMS collection when the CMS adapter is built. Shared field groups (metadata, navigation, lead image, related items) are defined once.
- **Site overrides without forking.** A site can replace any theme layout, partial or design token by providing a file of the same name in `site/`, using the pattern proven in the override spike.
- **Beautiful, accessible typography.** Three font sets, Hyperlegible, Mincho and Gothic, selectable by the site and by readers, all self-hosted under the SIL Open Font License.
- **Multilingual and bidirectional from the start.** Language-first paths, localized URLs, per-language site text and navigation, translatable theme interface strings, translations linked by a shared identifier, and one right-to-left locale, Arabic, built and tested as a required fixture.
- **Accessible and lightweight by default.** Semantic regions, skip links, Fluid Infusion UI Options support through CSS custom properties, build-time rendering instead of client-side scripts, and pages that work on low or intermittent bandwidth.
- **Portable output.** Alongside HTML, the build emits a JSON index of content and metadata, so content can move to another system without loss.

## Repository layout

Eleventy's input directory is `src/`, which holds site content only. Eleventy's default input is the folder it runs from, and it requires the includes, layouts and global data directories to be inside the input (<a id="cite-eleventy-config"></a>[Eleventy, n.d.-a](#ref-eleventy-config)). The theme can nevertheless sit outside `src/`, because templates reach it through a Nunjucks loader that reads from the repository root, and layouts are virtual stubs rather than files in a layouts directory (see Site overrides). The includes directory points at an empty `src/_includes`, and the global data directory is `src/_data`.

```text
eleventy-theme-katagami/
├── eleventy.config.js      sets directories, loads the theme plugin
├── package.json
├── .nvmrc                  selects Node 24
├── CLAUDE.md               standing rules for Claude Code sessions
├── README.md
├── LICENSE.md
├── CHANGELOG.md
├── .stylelintrc.json       rejects physical CSS properties
├── en/
│   └── docs/
│       └── dev/            project documentation, including this specification
│           └── artifacts/  earlier versions of the specification, named by version
├── scripts/                page and browser checks, fixture images, font and Infusion vendoring
├── src/                    Eleventy input: site content only
│   ├── _data/              site, locales, regions, navigation per language
│   ├── en/
│   │   ├── index.md
│   │   ├── _site/          footer, colophon
│   │   └── services/
│   ├── fr/
│   ├── ar/                 right-to-left fixture, excluded from the language switcher
│   └── media/              uploaded images and files
├── site/                   overrides of theme files, used to test shadowing, and an optional index.js
├── themes/
│   └── katagami/           the theme
└── _site/                  build output, not committed
```

Consequences of using `src/` as input:

- Pages publish at their path within `src/`, so `src/en/about.md` publishes at `/en/about/` with no permalink rules.
- Project documentation, the theme and site overrides are outside the input, so Eleventy never builds them as pages and needs no ignore rules for them.
- `src/media/` is passed through to the output, except raster images, which are published only as processed files, and theme assets are copied from `themes/katagami/assets/` by the theme plugin.

## Theme directory

```text
themes/katagami/
├── theme.yaml               manifest: name, version, license, Eleventy range, regions, blocks, views, fences, font sets, preferences, fonts, images
├── index.js                 plugin: loader, layout stubs, filters, shortcodes, collections, passthrough, virtual pages
├── typography.js            markdown-it plugin: quotation marks by language, French spacing by locale tag
├── README.md
├── LICENSE.md
├── CHANGELOG.md
├── assets/
│   ├── css/
│   │   ├── theme.css        entry point, imports the files below in order
│   │   ├── tokens.css       colours, type scale, spacing as custom properties
│   │   ├── base.css         element defaults
│   │   ├── grid.css         page regions and block grid
│   │   ├── components.css   parts, blocks and views
│   │   └── fonts/
│   │       ├── hyperlegible.css   each set with its Arabic companion, generated
│   │       ├── mincho.css
│   │       └── gothic.css
│   ├── fonts/               one folder per family, WOFF2, subset, with OFL.txt
│   ├── img/                 chevron.svg, the breadcrumb separator
│   ├── js/
│   │   ├── preferences.js       shows the preferences part, loads Infusion on demand
│   │   ├── preferences-uio.js   the theme's store, enactors and choices for UI Options
│   │   ├── search.js        planned
│   │   └── theme.js         planned
│   └── vendor/
│       └── infusion/            UI Options, copied by scripts/vendor-infusion.mjs
├── layouts/
│   ├── base.njk             skeleton with named regions, defines blocks
│   ├── home.njk             planned
│   ├── page.njk             extends base: title, lead and the blocks list
│   ├── section.njk          extends base: folder intro, then the selected view of its children
│   └── service.njk          planned
├── parts/                   one partial per region item
│   ├── skip-links.njk
│   ├── announcement.njk     planned
│   ├── logo.njk
│   ├── main-nav.njk
│   ├── site-search.njk      planned
│   ├── language-switcher.njk
│   ├── ui-options.njk
│   ├── breadcrumbs.njk
│   ├── section-nav.njk
│   ├── byline.njk           planned
│   ├── related-items.njk    planned
│   ├── footer-text.njk
│   ├── site-actions.njk
│   └── colophon.njk
├── partials/                pieces shared by layouts, blocks and views, never placed in regions
│   ├── block-list.njk
│   ├── picture.njk
│   ├── lead-image.njk
│   └── preferences-head.js  the head script that applies saved preferences
├── blocks/                  one partial per block type
│   ├── text.njk
│   ├── image.njk
│   ├── teaser.njk
│   ├── listing.njk
│   ├── grid.njk
│   └── call-to-action.njk
├── views/                   display views for folders and listings
│   ├── listing.njk
│   ├── summary.njk
│   ├── tabular.njk
│   └── album.njk
├── fences/                  deferred: renderers for text formats in code fences
│   ├── mermaid.js
│   └── csv.js
├── defaults/                fallback data, overridden by the site's src/_data/
│   ├── regions.yaml
│   └── navigation.yaml      planned
├── i18n/                    theme interface strings
│   ├── en.yaml
│   ├── fr.yaml
│   ├── ar.yaml
│   └── preferences/         messages for the preferences panel, published beside Infusion's
├── templates/               theme-provided pages, registered by index.js
│   ├── languages.njk        the language chooser at /
│   ├── sitemap.njk          planned
│   ├── 404.njk              planned
│   ├── feed.njk             planned
│   ├── robots.njk           planned
│   └── content-index.njk    planned, the JSON index
└── cms/                     deferred: CMS field fragments, for the CMS adapter
    ├── behaviors.yaml
    └── blocks.yaml
```

| Path | Required | Plone counterpart |
| --- | --- | --- |
| `theme.yaml` | Yes | Theme package metadata |
| `index.js` | Yes | Add-on profile registration |
| `layouts/` | Yes | `main_template` and type views |
| `parts/` | Yes | Viewlets and footer portlets |
| `blocks/` | Yes | Volto blocks |
| `views/` | Yes | Folder display views |
| `defaults/` | Yes | Default viewlet and portlet assignments |
| `i18n/` | Yes | Translation catalogues |
| `assets/` | Yes | Theme resources |
| `templates/` | Yes | Site-level views such as the sitemap |
| `fences/` | Optional | None; a static-site addition |
| `cms/` | Optional, deferred with the CMS adapter | Behavior schemas |

What does not go in the theme: site content, footer text and navigation labels belong in `src/{lang}/` and `src/_data/`; uploaded media belongs in `src/media/`; site-specific template or style changes belong in `site/`.

## Site overrides

Two spikes on Eleventy 3.1.7 settled how a site shadows theme files and where the theme can live. The theme does not need to be packaged as a plugin that provides its own layouts, a capability Eleventy does not offer directly (<a id="cite-eleventy-2307"></a>[Eleventy, n.d.-b](#ref-eleventy-2307)), and it does not need to be inside the input directory.

- **Partials** are shadowed by a Nunjucks environment whose loader searches `site/` before `themes/katagami/`, with caching off so edits are picked up in watch mode. The loader's paths are relative to the repository root, so both folders can sit outside `src/`.
- **Layouts** are shadowed through one-line virtual stubs. The layouts directory is set to a virtual `_layouts`, and the theme plugin registers a stub for each layout it ships, containing only `{% extends "layouts/<name>.njk" %}`. The extend goes through the same loader, so a site's version wins when one exists.
- **Watch mode** picked up edited overrides, newly added and deleted override files, and edits to theme files outside `src/`, all without a restart.
- **Documentation outside `src/`** is never built, even when it contains template syntax.

```js
cfg.setInputDirectory("src");
cfg.setIncludesDirectory("_includes");   // empty, inside src/
cfg.setLayoutsDirectory("_layouts");     // virtual only, no folder on disk
cfg.addWatchTarget("site/");
cfg.addWatchTarget("themes/katagami/");
cfg.setLibrary("njk", new Nunjucks.Environment(
  new Nunjucks.FileSystemLoader(["site", "themes/katagami"], { noCache: true })));
for (const f of fs.readdirSync("themes/katagami/layouts")) {
  cfg.addTemplate(`_layouts/${f}`, `{% extends "layouts/${f}" %}`);
}
cfg.addPassthroughCopy({ "themes/katagami/assets": "assets" });
```

Rules that follow from the spike:

- Layouts chain with `{% extends %}` and blocks, never with front-matter `layout:` inside a layout file, because front matter read through an extend appears as literal text.
- The site's `eleventy.config.js` sets the directories, since plugins cannot set the layouts directory; `themes/katagami/index.js` registers the loader, the stubs and everything else.
- The plugin registers a stub for each layout the theme ships and for each layout only the site has, by scanning `site/layouts/` at startup as well.
- `site/index.js` is an optional extension point for site-only build code, such as extra data, filters or pages. When it exists, the theme plugin adds it as a plugin after registering everything else, so it can rely on the theme's loader, filters and data. It must not set directories, which belong to `eleventy.config.js`, and a site without it builds the same way.

## Regions and site text

The base layout defines regions and renders an ordered list of parts in each. The list is data:

```yaml
# src/_data/regions.yaml
header: [skip-links, logo, main-nav, language-switcher, ui-options]
abovecontent: [breadcrumbs]
sidebar: [section-nav]
belowcontent: []
footer: [footer-text, site-actions, colophon]
```

The planned parts, `announcement` and `site-search` in the header and `related-items` below the content, join these lists when they are built. The theme's `defaults/regions.yaml` applies to any region the site leaves out, and an empty list removes a region. The sidebar sits at the inline end of the content on wide screens and moves below the content on phones.

A folder or page adjusts regions with `regionOverrides`, following Plone's portlet inheritance:

| Value for a region | Effect |
| --- | --- |
| A list of parts | Adds those parts to what the folder above provides |
| A single part name | Replaces the region with that one part |
| `none` | Blocks inheritance and empties the region |

```yaml
# front matter of a page that needs no sidebar and an extra footer part
regionOverrides:
  sidebar: none
  footer: [contact-strip]
```

A setting applies to the folder or page that makes it and to everything beneath it. When a folder and a page both add to the same region, the folder's parts come first, then the page's, and a part listed by both appears once.

Site-wide text lives in short Markdown files, one set per language:

```text
src/en/_site/
├── footer.md           footer text in the body, structured links in front matter
├── announcement.md     optional banner above the header, planned
└── colophon.md         licence and credits line
```

A directory data file in `_site/` sets `permalink: false` and excludes the files from collections, so they are never published as pages, only placed into regions. Free text goes in the Markdown body; anything list-like, such as site actions or contact links, goes in front matter fields that editors fill in as labels and URLs. There is no `header.md`: the logo, navigation, search and language switcher come from the theme and site data, and an editable header invites editors to rebuild the menu by hand.

## Folders, navigation and breadcrumbs

| Plone | Katagami |
| --- | --- |
| Folder | A directory under `src/{lang}/` |
| Folder title, description, display view | The folder's `index.md` front matter |
| Default page of a folder | The body of that same `index.md` |
| Settings inherited by contents | A directory data file setting `layout`, `type` and `regionOverrides` |
| Addable types constraint | A CMS collection scoped to that directory, deferred with the CMS adapter |
| Exclude from navigation, position in parent | Navigation fields on every page |

The theme plugin gives every page in a language folder a navigation entry automatically, so `src/` contains no JavaScript and sites need no navigation data beyond the main menu.

- **Keys** are page paths, such as `en/services/workshops/kyoto`, until shared identifiers replace them (see Languages and translations).
- **Parents** are the nearest folder above the page that has an `index.md`. The build warns about a directory of pages without one, since its pages would otherwise attach silently to the folder above.
- **Editor fields** are three, on every page:

| Field | Meaning |
| --- | --- |
| `menuTitle` | A short title for menus and breadcrumbs |
| `order` | The position within its folder |
| `excludeFromNav` | Hides the page from menus; it still appears in its folder's listing, as in Plone |

The three navigation areas:

- **Main menu.** Top-level items only, from `src/_data/navigation/{lang}.yaml`, with the current section marked `aria-current="true"`. Version 1 has no header dropdowns, because accessible dropdowns need JavaScript; dropdowns may come later as an enhancement over working links.
- **Breadcrumbs.** An ordered list from Home down to the current page through each folder, marked `aria-current="page"` on the last item. The separator is generated in CSS, mirrors in right-to-left pages and is not announced by screen readers.
- **Section navigation.** In the sidebar, the current top-level section opened down to the current page, with `aria-current="page"` on the current item. On a folder's own page it shows the folder's ancestors and siblings without expanding its children, because the folder's view already lists them.

Each `<nav>` element has its own `aria-label`.

## Languages and translations

- **Language switcher.** Links to the same page in other languages. Pages are matched by their path without the language prefix, so `/en/services/` and `/fr/services/` pair with no setting. A page with a different slug sets `translationKey` to the matching English page's path. With no translation, the link goes to that language's home page.
- **Language chooser.** The theme builds a chooser at `/` unless `src/` provides its own root page.
- **Production builds.** A production build hides fixture locales, `ar` for now, from the chooser and from the language switcher on every page; development builds show them.
- **Localized URLs.** A requirement: every page and folder can have a name in its own language, so `/fr/services/conception/` pairs with `/en/services/design/`, and a French folder can carry a French name. Release 0.5.1 supports localized page names through `translationKey`, until an English page is moved: the key holds the English page's path, so moving that page breaks its translations' pairing until the key is updated. Localized folder names wait for identifier pairing. File and folder names stay ASCII and kebab-case in every language.
- **Pairing by identifier, planned.** Every language's file of a page carries the same `urn:uuid` identifier in its front matter, and so does every language's `index.md` of a folder. The build pairs translations, and keys navigation, by that identifier instead of by path, so any file or folder can be renamed in one language without breaking its pairing or the links to its translations. The identifier is the stable identity SAT egress already emits (see SAT egress and navigation). `translationKey` remains until identifier pairing is built.
- **Redirects, deferred.** Renaming a file or folder changes its URL. Redirects from old URLs are deferred until after identifier pairing, which gives a renamed page an identity to redirect by.

## Visual direction and typography

The visual direction is vintage Japanese minimalism, drawing on Taishō and Shōwa-era print design rather than Zen cliché: generous margins and negative space (ma), asymmetric layouts on a strict grid, a muted natural palette of indigo, sumi black, washi off-white and a persimmon accent, two weights per font set, and no decorative typefaces, cherry blossoms or faux brush lettering.

| Font set | Headings | Body | Arabic | Role |
| --- | --- | --- | --- | --- |
| Hyperlegible | Atkinson Hyperlegible Next | Atkinson Hyperlegible Next | IBM Plex Sans Arabic | Accessibility default and the reader's maximum-legibility choice |
| Mincho | Shippori Mincho | Atkinson Hyperlegible Next | Noto Naskh Arabic | The signature Katagami look, with a Japanese book-printing character |
| Gothic | Zen Kaku Gothic New | Atkinson Hyperlegible Next | IBM Plex Sans Arabic | A calm, modern alternative in the universal-design tradition |

Atkinson Hyperlegible Next sets body text in every set, so the sets differ in their headings and Arabic companion. BIZ UDPGothic was set aside because its curly quotes and apostrophes are full width, which breaks English and French text.

- Each set is one CSS file under `assets/css/fonts/` that declares its `@font-face` rules, including its Arabic companion's, and sets `--font-heading` and `--font-body`; the rest of the theme uses only those tokens. The files are generated by `scripts/vendor-fonts.mjs` from the fonts and sets listed in `theme.yaml`, which copies each font's WOFF2 subsets and its `OFL.txt` from a Fontsource package into `assets/fonts/`.
- `theme.yaml` lists the sets, the site chooses a default with `fontSet` in `src/_data/site.yaml`, and readers can choose another in the preferences panel (see Reader preferences).
- Only the active set's CSS loads, only the regular weight of the font the page's text uses most is preloaded, and every font is WOFF2 with `font-display: swap`.
- Fonts are subset to Latin and Latin Extended, which covers French, and to Arabic for the Arabic companions; each font has the 400 and 700 weights only. Japanese subsets load only if the site ever publishes Japanese text.
- Language names in the language switcher and the language chooser are set in a system font stack, so no page downloads a web font just to show another language's name.
- `scripts/vendor-fonts.mjs` takes exact, pinned Fontsource versions from `theme.yaml` and refuses a version range, so a rerun reproduces the same files.

The type system:

- **Modular scale.** Type sizes are steps of a modular scale with a ratio of 1.25, a major third, from a 1rem body size, computed from a `--ratio` token. The step below the body size is half a step rather than a whole one, so that small text stays legible.
- **Measure.** Text elements keep a measure of 66 characters; grids, tables and albums use the full content column.
- **Vertical rhythm.** One baseline unit, 0.375rem, governs every line height and every vertical margin between blocks of text. A line of body text is four baselines; headings take five or six, and one more in Arabic for its taller letters and marks; Arabic body text, set slightly larger, takes five. Images keep their proportions, read from `src/media/` at build time, with their height rounded up to a whole baseline; cards and thumbnails are rounded the same way; and rules are outlines or inset shadows, which take no space. Images and bordered elements may sit off the grid themselves, but the text after them returns to it. A browser check confirms this, with no allowance beyond sub-pixel rounding, in Latin and Arabic text, on pages with and without images, in every font set at phone and desktop widths.
- **Wrapping.** `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs, list items, captions, quotations and table cells.
- **Plain titles.** Titles and descriptions are plain text everywhere they appear: headings, the page title, meta descriptions, breadcrumbs, navigation, the JSON index and accessible labels. They get smart punctuation and French spacing, but Markdown syntax in them is never rendered and anything that looks like HTML is shown as text.
- **Smart punctuation.** Typographic quotation marks and apostrophes in Markdown and in plain-text fields such as titles and descriptions, with the marks of the page's language: “ ” and ‘ ’ in English, « » with non-breaking spaces and “ ” inside them in French, « » and ‹ › in Arabic.
- **French spacing.** French pages follow their locale's tag. `fr-CA` uses Quebec's conventions: a non-breaking space before a colon and no space before ; ! ?. `fr` and `fr-FR` use France's: a narrow non-breaking space before ; ! ? and a non-breaking space before a colon. Both put non-breaking spaces inside « ». Spacing never touches code, URLs or times such as 12:45.
- **OpenType numerals and small caps.** Table cells use tabular figures, which Atkinson Hyperlegible Next and Noto Naskh Arabic offer; table headings ask for small caps. None of the chosen fonts has small caps or old-style figures, and faux small caps are never drawn, so table headings stay in ordinary letters until a font set offers them.

## Reader preferences

Readers adjust four things through Fluid Infusion UI Options (<a id="cite-infusion"></a>[Fluid Project, n.d.](#ref-infusion)), in a panel that opens below the header. Each is mapped onto the theme's custom properties by an enactor of the theme's own:

| Preference | Choices | Theme tokens |
| --- | --- | --- |
| Text size | 0.5 to 2 times | `--text-size` scales the root font size, so the modular scale and the baseline grid scale together |
| Line spacing | 0.7 to 2 times | `--line-space` scales the baseline unit, rounded to a whole pixel, so every line height and vertical margin follows |
| Fonts | The theme's font sets | The font set's stylesheet |
| Contrast | Follow my device (the default), the site's colours, high contrast, dark | `data-contrast` on the html element, with the schemes in `tokens.css` |

- **Enhancement.** Without JavaScript the preferences part stays hidden and readers get the site's settings and their own system settings. The panel's button appears with JavaScript, and Infusion loads only when a reader first opens the panel, about 176 KB compressed.
- **System settings.** `prefers-color-scheme: dark` and `prefers-contrast: more` choose the dark and high-contrast schemes through CSS media queries, also without JavaScript; `prefers-reduced-motion` turns off animation, including Infusion's. An explicit choice in the panel, the site's colours included, overrides them.
- **Storage.** Preferences are kept in local storage under one key, `katagami-preferences`, as `{ "version": 1, … }` with only the values that differ from the defaults; the version lets the format change later. A static site has no server to read a cookie, and a cookie would travel with every request, so the theme gives UI Options its own local storage store instead of the default cookie. Every read and write is guarded, so blocked storage falls back to the defaults without errors. A font set saved by phase 4 under `katagami-font-set` moves into the new key once.
- **Before the page is drawn.** A short, static script in the page head applies saved preferences.
- **Content Security Policy.** The site works, panel included, under `default-src 'self'; script-src 'self'` plus the head script's hash, `style-src 'self'` plus the hash of the one `<style>` element Infusion's core adds. No `'unsafe-eval'` or `'unsafe-inline'` is needed. Each build writes the policy with its current hashes to `assets/csp.json`, the page check confirms every page's inline script matches, and a browser check opens the panel under the policy and fails on any violation. The breadcrumb separator is a file, not a `data:` URL, so images need nothing beyond `'self'`.
- **The button.** Its label is the theme's own and stays the same, "Display preferences" in English and "Préférences d’affichage" in French; `aria-expanded` tells whether the panel is open. If Infusion cannot load, the button shows a short, translated message, a status message announces it, and the rest of the page is unaffected.
- **Reset.** The panel's reset button clears `katagami-preferences` and returns every preference to its default, before or after Infusion has loaded.
- **Self-hosted.** `scripts/vendor-infusion.mjs` copies Infusion, at the exact version pinned in `theme.yaml`, into `assets/vendor/infusion/`: the UI Options build, three stylesheets, the panel's icon font, the four panels' templates, Infusion's English and French messages for text size and line spacing, and the licences of Infusion and of jQuery and fastXmlPull, which the build bundles. Upgrading Infusion requires rerunning the browser checks, because the theme re-registers Infusion's font and contrast schemas. Infusion's stylesheets read custom properties, which the theme points at its own colours and fonts.
- **Languages.** The theme supplies the messages for the panel's button and its font set and contrast choices in every language, and Arabic messages for the whole panel, in `i18n/preferences/`.
- **Accessibility audits.** `npm run check:browser` runs axe-core on home pages, text pages and pages with images in all three languages, under the site's colours, high contrast and dark, and with the panel open. The panel takes the page's language and direction, and works right to left.

## Right-to-left support

Arabic is built as a required fixture locale. It is the most demanding common right-to-left case, because its letters join, it mixes directions constantly and it has no italics, so a theme that handles Arabic will largely handle Hebrew, Persian and Urdu.

```yaml
# src/_data/locales.yaml
- { code: en, name: English, dir: ltr }
- { code: fr, tag: fr-CA, name: Français, dir: ltr }
- { code: ar, name: العربية, dir: rtl, fontSet: arabic, fixture: true }
```

- Every page sets `lang` and `dir` from the locales file. A locale's `code` names its folder and URL prefix; its `tag`, when given, is the full language tag, such as `fr-CA`, used for the `lang` attribute, dates and typography.
- CSS uses logical properties only (`margin-inline-start`, `padding-block`, `inset-inline-end`, `text-align: start`), enforced by stylelint, so regions, the block grid and asymmetric layouts mirror automatically.
- Directional icons flip with `:dir(rtl)`; logos, the kamon, checkmarks and media controls do not, and the theme marks which is which.
- Text of unknown direction, such as titles in listings and author names, is wrapped in `<bdi>` or given `dir="auto"`, and code blocks are always left-to-right.
- An Arabic companion font (Noto Naskh Arabic with the Mincho set; IBM Plex Sans Arabic with the Gothic and Hyperlegible sets) is selected per character with `unicode-range`. A locale with `fontSet: arabic` preloads its companion instead of the Latin body font. Arabic text gets no letter-spacing, no faux italics, and a slightly larger size and line height.
- Dates and numbers are formatted with `Intl.DateTimeFormat` and `Intl.NumberFormat`.
- The fixture covers a home page, a section, a page with blocks, a listing and a page with mixed-direction text, is built by every build, development and production, and stays out of the production language switcher and chooser until an Arabic reader has reviewed it and real, human-translated content exists. The repository has no CI service yet, so the checks run locally; a CI workflow is part of the production-essentials phase.

## Blocks

Version 1 ships six block types: text, image, teaser, listing, grid and call to action. Each has one partial in `blocks/`, and will have one field definition in `cms/blocks.yaml` when the CMS adapter is built.

An embed block is deferred until after version 1. Embeds normally load third-party frames, which conflicts with the rule against third-party requests at runtime, so the embed block will show a local placeholder and contact the third party only when the reader asks.

An unknown block type renders a visible placeholder and a console warning in development builds, so editing never breaks, and fails a production build, so a broken page is never published.

## Embedded HTML and text formats

Raw HTML in Markdown is presentation leaking into content, so it is escaped by default. A sanitizer may allow a short list of inline tags (`abbr`, `kbd`, `sub`, `sup`, `details`) with no `style` or `class` attributes. The Markdown template engine is disabled for `src/`, so template syntax in an editor's text is never executed.

| Editors want | They use |
| --- | --- |
| Columns, cards, side-by-side layout | Grid and teaser blocks |
| Callouts: note, warning, tip | Fenced containers (`::: note`) rendered by a theme partial |
| Video, map or other embeds | An embed block, after version 1, that loads only on the reader's request |
| Figures with captions | An image block |
| Collapsible sections | A `::: details` container |

Text formats inside code fences are content and are rendered by handlers in `fences/`. Mermaid diagrams are rendered to inline SVG at build time, cached by a hash of their source, with `accTitle` and `accDescr` required and the source kept in a `<details>` element as a fallback. An unknown fence language falls back to a normal code block. A build-time linter warns about raw HTML and missing diagram descriptions.

## CMS support

The CMS adapter, meaning the CMS configuration, the theme's `cms/` field fragments and the script that merges them, is deferred. The site is edited as files in the meantime.

Sveltia is a Git-based CMS that reads and writes only the folders and files its configuration names (<a id="cite-sveltia"></a>[Sveltia, n.d.](#ref-sveltia)), so a `themes/` folder it is never pointed at is invisible to it, and it remains the likely choice. Sveltia CMS 0.253.2 was tested in October 2026 against the fixture site, in its local repository mode:

- **Nested folders work.** A folder collection with `{{locale}}` in its path and nested subfolders, `src/{{locale}}/services/` with `workshops/` beneath it, lists, opens and saves entries in subfolders, and writes each language's file in place. A save rewrites every language's file and reformats its YAML front matter, keeping fields the configuration does not declare.
- **Arabic fields display right to left.** The `ar` locale's fields have `dir="rtl"`.
- **Localized slugs misbehave.** With localized slugs on, a save renamed French files to the English slug, such as `fr/services/conception.md` to `fr/services/design.md`; a new French translation got a non-ASCII file name, `accompagnement-éditorial.md`; and a new French translation of a page in a subfolder was written to `src/fr/services/atelier-de-nara.md` instead of into `workshops/`. Without localized slugs, translations land in the right subfolder but share the English file name.
- **Pairing by English slug.** Sveltia pairs translations by a key equal to the English slug, which matches `translationKey` today but not the planned identifier pairing.
- **A version check.** Sveltia's admin page checks online for a newer version, a request to a third party.

Because localized URLs are a requirement, the adapter waits for identifier pairing and for a Sveltia release, or another Git-based CMS, that keeps each language's file and folder names and places translations of subfolder pages in the right subfolder. The earlier plan is the starting point:

| Setting | Points to | Notes |
| --- | --- | --- |
| Folder collections | `src/{{locale}}/<section>/` | One collection per top-level section, matching the main menu, with nested subfolders |
| File collections | `src/{{locale}}/_site/*.md`, `src/_data/navigation/`, `src/_data/site.yaml` | "Site text" for editors |
| `i18n` structure | `multiple_folders` | Matches the language-first paths |
| `media_folder` and `public_folder` | `src/media/` and `/media` | Never inside the theme |
| Block fields | A variable-type list matching the partials in `blocks/` | Definitions come from the theme's `cms/` fragments |

- **One configuration file.** Theme field fragments in `cms/` are merged into the site's CMS configuration by a build script.
- **No editing of theme defaults.** The CMS never points at `themes/`; site data in `src/_data/` overrides the defaults.
- **Preview fidelity.** A CMS preview does not run Eleventy or render Mermaid, so editors rely on a deploy preview for the final view.

## SAT egress and navigation

SAT owns the facts about structure, and Eleventy owns the menus. Dublin Core and `sat:` metadata stay canonical, and web front matter is derived.

| Concern | Owner |
| --- | --- |
| Position in the hierarchy | SAT |
| Title, menu title, order, hide from navigation | SAT metadata, emitted as front matter |
| Stable identity (`urn:uuid`) | SAT, emitted as the navigation and translation key |
| Mapping SAT paths to web paths | SAT egress |
| Menus, breadcrumbs, section listings | Eleventy, from the emitted tree |
| The curated top menu | Site data in the site repository |

Egress emits a directory tree with an `index.md` per folder and rich front matter, never a finished menu. A menu baked in egress would tie SAT to one site's presentation and would be wrong once a collection moves to another SAT instance. A menu label can map to `dcterms:alternative`; order within a parent and exclusion from navigation have no DCTERMS counterpart and are candidates for coined `sat:` terms.

## Build phases

1. Skeleton: repository layout, site override pattern, base layout with regions, site text, and `en`, `fr` and `ar` fixtures. Done.
2. Folders, navigation, breadcrumbs, the sidebar region, region overrides and the language switcher. Done.
3. Blocks and views, including the folder-page behavior of section navigation. Done.
4. Font sets and the type system. Done.
5. Reader preferences: Fluid Infusion UI Options for fonts, contrast, text size and line spacing. Done.
6. Production essentials, the next phase: the 404 page, sitemap, robots file, feed, JSON content index, inline-tag sanitizer and containers, assessed with their conditions for done in [Katagami: Production Essentials](../theme/radar/assess/production-essentials.md), and a CI workflow that runs `npm run build`, `npm run lint`, `npm run check` and `npm run check:browser` on every push, once the repository has a remote.
7. The CMS adapter: CMS configuration and the `cms/` merge. Deferred, see CMS support.
8. Fences, starting with Mermaid build-time rendering. Deferred.

Each phase ends with a clean build of all three locales. Work paused after phase 5, at release 0.5.1. Also deferred: the embed block, localized folder names with identifier pairing, and redirects.

Not yet in any phase, and marked planned in the theme directory: the announcement banner, site search, the byline and related-items parts, the home and service layouts, and a fallback navigation in `defaults/`. The assessment places them later, as client sites need them.

## Arabic reader's review

Before the `ar` locale leaves fixture status, an Arabic reader reviews:

- [ ] The companion fonts, Noto Naskh Arabic with Mincho and IBM Plex Sans Arabic with Gothic and Hyperlegible, including their size and line height beside Latin text.
- [ ] The quotation marks, « » with ‹ › inside them.
- [ ] The digits, Arabic-Indic or Western (see Open questions).
- [ ] The theme's interface strings in `themes/katagami/i18n/ar.yaml`: the skip link, navigation and breadcrumb labels, the tabular view's column headings, the reset button and the placeholders for unknown blocks and views.
- [ ] The preferences panel's button label, تفضيلات العرض, and its failed-load message, تعذّر تحميل التفضيلات.
- [ ] The rest of the panel's Arabic strings in `themes/katagami/i18n/preferences/`: the text size, line spacing, font and contrast panels, including the font set names سهل القراءة, مينتشو and قوطي.
- [ ] The fixture's Arabic text, which was not written by a native speaker: the pages and site text in `src/ar/`, the menu in `src/_data/navigation/ar.yaml`, and the language name العربية in `src/_data/locales.yaml`.

## Open questions

- [ ] **What does the CMS edit when content comes from SAT egress?** Deferred with the CMS adapter. Option 1: Sveltia edits SAT content directly and egress runs in CI after each commit. Option 2: Sveltia owns some content types in the site repository and egress never touches those folders. Option 3: two-way sync with an ingress step, the most flexible and the most fragile. Option 1 or 2 is preferred for non-technical editors; the decision also belongs in the SAT config cascade specification.
- [x] **Which Mincho and Gothic fonts?** Decided from the specimens: Shippori Mincho and Zen Kaku Gothic New.
- [x] **Atkinson Hyperlegible or Atkinson Hyperlegible Next?** Decided: Atkinson Hyperlegible Next, for body text in every set.
- [x] **Which Arabic companion fonts?** Decided: Noto Naskh Arabic with Mincho, IBM Plex Sans Arabic with Gothic and Hyperlegible, subject to the Arabic reader's review below.
- [ ] **Arabic reader's review.** The checklist is in its own section, Arabic reader's review.
- [ ] **Which digits on Arabic pages?** Arabic-Indic or Western (`ar-u-nu-latn`), depending on the audience.
- [x] **Does Sveltia edit right-to-left fields properly?** Tested with 0.253.2: the `ar` locale's fields display right to left (see CMS support).
- [ ] **How do Mermaid diagrams behave on right-to-left pages?** Mermaid's right-to-left support is limited; diagrams may keep a left-to-right flow with translated labels.
- [ ] **Which Eleventy version do we target?** Version 3 is stable and version 4 is in pre-release; `theme.yaml` records the supported range.
- [ ] **Mermaid rendering in CI.** Build-time rendering needs a headless browser; confirm the cache-by-hash approach keeps it out of routine builds. Deferred with fences.
- [ ] **Does Sveltia accept several configuration files or custom editor components?** Either would simplify the `cms/` merge and give editors buttons for callouts and embeds. Deferred with the CMS adapter.
- [ ] **How do client sites consume the theme?** A git submodule, an npm package, or a copied folder with its version recorded in `theme.yaml`.
- [x] **Translation pairing when an English page moves.** Decided: a shared `urn:uuid` identifier in every language's file, including each folder's `index.md` (see Languages and translations). Until it is built, `translationKey` points at the English page's path, so moving that page breaks its pairing.
- [ ] **Identifier pairing details.** The front matter field's name, whether SAT egress or a site script writes identifiers for content made outside SAT, and what the build reports for a file without an identifier or two files of one language sharing one.
- [ ] **A replace form for region lists.** If adding to inherited parts proves limiting, consider an explicit `only: [...]` value that replaces a region with a list.

## References

<a id="ref-eleventy-config"></a>Eleventy. (n.d.-a). *Configuration*. Retrieved October 28, 2026, from https://www.11ty.dev/docs/config/
[Return to citation](#cite-eleventy-config)

<a id="ref-eleventy-2307"></a>Eleventy. (n.d.-b). *Allow plugins to provide layouts and includes* (Issue No. 2307) [GitHub issue]. GitHub. Retrieved October 28, 2026, from https://github.com/11ty/eleventy/issues/2307
[Return to citation](#cite-eleventy-2307)

<a id="ref-infusion"></a>Fluid Project. (n.d.). *User Interface Options API*. Fluid Infusion. Retrieved October 28, 2026, from https://docs.fluidproject.org/infusion/development/UserInterfaceOptionsAPI.html
[Return to citation](#cite-infusion)

<a id="ref-sveltia"></a>Sveltia. (n.d.). *Sveltia CMS* [Computer software]. GitHub. Retrieved October 28, 2026, from https://github.com/sveltia/sveltia-cms
[Return to citation](#cite-sveltia)
