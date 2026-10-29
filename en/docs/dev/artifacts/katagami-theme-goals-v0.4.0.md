---
title: "Katagami Theme: Goals"
description: "Goals, repository layout, theme directories, typography, directionality and open decisions for Katagami, a Plone-inspired Eleventy theme for Vishpala websites."
date: 2026-10-28
version: 0.4.0
lang: en
author: Christopher Steel
---

# Katagami Theme: Goals

## Purpose

Katagami is a reusable, Plone-inspired theme for Eleventy with a vintage Japanese, minimalist visual style. Every Vishpala site starts from the same defaults for header, footer, page regions, grid layout and typography. Content lives in Markdown and data files that editors manage through Sveltia CMS; presentation lives only in the theme. One site differs from another by its content and a small set of overrides, never by a fork of the templates.

The name comes from katagami, the paper stencils used to print patterns onto kimono fabric. The stencil carries the design and the cloth carries the substance, which is the separation of content and presentation this theme is built on.

The Plone ideas we borrow are content types defined as schemas, reusable field groups (behaviors), named page regions filled from data (viewlet managers), an editable footer (footer portlets), folders with their own properties and default page, saved queries with selectable display views, and structured blocks for page layout (Volto).

## Goals

- **A theme repository with its own test site.** The repository `eleventy-theme-katagami` holds the theme in `themes/katagami/` and a demo and fixture site in `src/`, which doubles as the theme's test suite. Only `src/` is Eleventy's input; the theme, site overrides and project documentation sit beside it.
- **A fixed, documented theme directory structure.** Every theme has the same required directories, so tooling, documentation and editors can rely on them.
- **Strict separation of content from presentation.** Content may contain text formats (Markdown, Mermaid, CSV) but not presentation formats (HTML, CSS, class names). Templates, partials, styles and scripts live only in the theme.
- **Header, footer and named regions as defaults.** One base layout defines regions: header, navigation, above content, content, below content, footer, and optional side columns. What fills each region is data, overridable per directory or per page through the Eleventy data cascade.
- **Simple editing for non-technical creators.** Site-wide text such as the footer, an announcement banner and the colophon is written as short Markdown files, one per language. Editors fill in fields and write prose; they never touch layout or markup.
- **Folders that are directories.** A folder is a directory plus its `index.md`. Navigation, breadcrumbs, section listings and inherited settings all follow from that one convention.
- **Grid layout through blocks.** Pages are composed of typed blocks (text, image, teaser, listing, grid, embed, call to action), each rendered by one theme partial, with CSS Grid doing all layout.
- **Content types with reusable behaviors.** Each Sveltia collection maps to a content type and a default layout. Shared field groups (metadata, navigation, lead image, related items) are defined once.
- **Site overrides without forking.** A site can replace any theme layout, partial or design token by providing a file of the same name in `site/`, using the pattern proven in the override spike.
- **Beautiful, accessible typography.** Three font sets, Hyperlegible, Mincho and Gothic, selectable by the site and by readers, all self-hosted under the SIL Open Font License.
- **Multilingual and bidirectional from the start.** Language-first paths, per-language site text and navigation, translatable theme interface strings, translations linked by a shared identifier, and one right-to-left locale, Arabic, built and tested as a required fixture.
- **Accessible and lightweight by default.** Semantic regions, skip links, Fluid Infusion UI Options support through CSS custom properties, build-time rendering instead of client-side scripts, and pages that work on low or intermittent bandwidth.
- **Portable output.** Alongside HTML, the build emits a JSON index of content and metadata, so content can move to another system without loss.

## Repository layout

Eleventy's input directory is `src/`, which holds site content only. Eleventy's default input is the folder it runs from, and it requires the includes, layouts and global data directories to be inside the input (<a id="cite-eleventy-config"></a>[Eleventy, n.d.-a](#ref-eleventy-config)). The theme can nevertheless sit outside `src/`, because templates reach it through a Nunjucks loader that reads from the repository root, and layouts are virtual stubs rather than files in a layouts directory (see Site overrides). The includes directory points at an empty `src/_includes`, and the global data directory is `src/_data`.

```text
eleventy-theme-katagami/
├── eleventy.config.js      sets directories, loads the theme plugin
├── package.json
├── CLAUDE.md               standing rules for Claude Code sessions
├── README.md
├── LICENSE.md
├── CHANGELOG.md
├── .stylelintrc.json       rejects physical CSS properties
├── en/
│   └── docs/
│       └── dev/            project documentation, including this specification
├── src/                    Eleventy input: site content only
│   ├── _data/              site, locales, regions, navigation per language
│   ├── en/
│   │   ├── index.md
│   │   ├── _site/          footer, announcement, colophon
│   │   └── services/
│   ├── fr/
│   ├── ar/                 right-to-left fixture, excluded from the language switcher
│   ├── admin/              Sveltia CMS: index.html and config.yml
│   └── media/              uploads, the Sveltia media folder
├── site/                   overrides of theme files, used to test shadowing
├── themes/
│   └── katagami/           the theme
└── _site/                  build output, not committed
```

Consequences of using `src/` as input:

- Pages publish at their path within `src/`, so `src/en/about.md` publishes at `/en/about/` with no permalink rules.
- Project documentation, the theme and site overrides are outside the input, so Eleventy never builds them as pages and needs no ignore rules for them.
- `src/admin/` and `src/media/` are passed through to the output unchanged, and theme assets are copied from `themes/katagami/assets/` by the theme plugin.

## Theme directory

```text
themes/katagami/
├── theme.yaml               manifest: name, version, license, Eleventy range, regions, blocks, views, fences, font sets
├── index.js                 plugin: loader, layout stubs, filters, shortcodes, collections, passthrough, virtual pages
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
│   │       ├── hyperlegible.css
│   │       ├── mincho.css
│   │       ├── gothic.css
│   │       └── arabic.css
│   ├── fonts/               one folder per family, WOFF2, subset
│   ├── img/
│   └── js/
│       ├── font-preference.js
│       ├── search.js
│       └── theme.js
├── layouts/
│   ├── base.njk             skeleton with named regions, defines blocks
│   ├── home.njk
│   ├── page.njk             extends base: title, lead and the blocks list
│   ├── section.njk          extends base: folder intro, then the selected view of its children
│   └── service.njk
├── parts/                   one partial per region item
│   ├── skip-links.njk
│   ├── announcement.njk
│   ├── logo.njk
│   ├── main-nav.njk
│   ├── site-search.njk
│   ├── language-switcher.njk
│   ├── ui-options.njk
│   ├── breadcrumbs.njk
│   ├── section-nav.njk
│   ├── byline.njk
│   ├── related-items.njk
│   ├── footer-text.njk
│   ├── site-actions.njk
│   └── colophon.njk
├── blocks/                  one partial per block type
│   ├── text.njk
│   ├── image.njk
│   ├── teaser.njk
│   ├── listing.njk
│   ├── grid.njk
│   ├── embed.njk
│   └── call-to-action.njk
├── views/                   display views for folders and listings
│   ├── listing.njk
│   ├── summary.njk
│   ├── tabular.njk
│   └── album.njk
├── fences/                  renderers for text formats in code fences
│   ├── mermaid.js
│   └── csv.js
├── defaults/                fallback data, overridden by the site's _data/
│   ├── regions.yaml
│   └── navigation.yaml
├── i18n/                    theme interface strings
│   ├── en.yaml
│   ├── fr.yaml
│   └── ar.yaml
├── templates/               theme-provided pages, registered by index.js
│   ├── sitemap.njk
│   ├── 404.njk
│   ├── feed.njk
│   ├── robots.njk
│   └── content-index.njk
└── cms/                     Sveltia field fragments, merged into admin/config.yml
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
| `cms/` | Optional | Behavior schemas |

What does not go in the theme: site content, footer text and navigation labels belong in `content/` and `_data/`; uploaded media belongs in `media/`; site-specific template or style changes belong in `site/`.

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
- Only layouts the theme ships get stubs. A site-only layout requires the plugin to scan `site/layouts/` at startup as well.

## Regions and site text

The base layout defines regions and renders an ordered list of parts in each. The list is data:

```yaml
# _data/regions.yaml
header: [skip-links, announcement, logo, main-nav, site-search, language-switcher, ui-options]
abovecontent: [breadcrumbs]
belowcontent: [related-items]
footer: [footer-text, site-actions, colophon]
```

The theme's `defaults/regions.yaml` applies when the site provides nothing. A directory data file or page front matter can override any region, or set it to an empty list to remove it, and the change applies to everything beneath that point.

Site-wide text lives in short Markdown files, one set per language:

```text
content/en/_site/
├── footer.md           footer text in the body, structured links in front matter
├── announcement.md     optional banner above the header
└── colophon.md         licence and credits line
```

A directory data file in `_site/` sets `permalink: false` and excludes the files from collections, so they are never published as pages, only placed into regions. Free text goes in the Markdown body; anything list-like, such as site actions or contact links, goes in front matter fields that editors fill in as labels and URLs. There is no `header.md`: the logo, navigation, search and language switcher come from the theme and site data, and an editable header invites editors to rebuild the menu by hand.

## Folders, navigation and breadcrumbs

| Plone | Katagami |
| --- | --- |
| Folder | A directory under `content/{lang}/` |
| Folder title, description, display view | The folder's `index.md` front matter |
| Default page of a folder | The body of that same `index.md` |
| Settings inherited by contents | A directory data file setting `layout`, `type` and `regions` |
| Addable types constraint | A Sveltia collection scoped to that directory |
| Exclude from navigation, position in parent | Navigation fields on every page |

A computed data file in `content/` gives every page an Eleventy Navigation entry with a key, a parent derived from its directory, a menu title and an order. Breadcrumbs walk up the parents. Section navigation lists a folder's children. The main menu comes from `_data/navigation/{lang}.yaml` instead of the tree, so a curated top menu stays stable while each item's children come from its directory.

Editors see three plain navigation fields: a short title for menus, an order, and a switch to hide the page from navigation.

## Visual direction and typography

The visual direction is vintage Japanese minimalism, drawing on Taishō and Shōwa-era print design rather than Zen cliché: generous margins and negative space (ma), asymmetric layouts on a strict grid, a muted natural palette of indigo, sumi black, washi off-white and a persimmon accent, two weights per font set, and no decorative typefaces, cherry blossoms or faux brush lettering.

| Font set | Fonts | Role |
| --- | --- | --- |
| Hyperlegible | Atkinson Hyperlegible | Accessibility default and the reader's maximum-legibility choice |
| Mincho | Shippori Mincho or Zen Old Mincho for headings, Atkinson Hyperlegible for body | The signature Katagami look, with a Japanese book-printing character |
| Gothic | BIZ UDPGothic or Zen Kaku Gothic New | A calm, modern alternative in the universal-design tradition |

- Each set is one CSS file under `assets/css/fonts/` that declares its `@font-face` rules and sets `--font-heading` and `--font-body`; the rest of the theme uses only those tokens.
- `theme.yaml` lists the sets, the site chooses a default in `_data/site.yaml`, and `font-preference.js` lets readers switch, also feeding Fluid Infusion UI Options.
- Only the active set's CSS loads, only the default regular weight is preloaded, and every font is WOFF2 with `font-display: swap`.
- Fonts are subset to Latin and Latin Extended, which covers French; Japanese subsets load only if the site ever publishes Japanese text.
- The type system provides a modular scale, a measure of about 60 to 70 characters, vertical rhythm from one baseline unit, `text-wrap: balance` on headings and `text-wrap: pretty` on body text, smart punctuation, French spacing on French pages, and OpenType numerals and small caps where the fonts offer them.

## Right-to-left support

Arabic is built as a required fixture locale. It is the most demanding common right-to-left case, because its letters join, it mixes directions constantly and it has no italics, so a theme that handles Arabic will largely handle Hebrew, Persian and Urdu.

```yaml
# _data/locales.yaml
- { code: en, name: English, dir: ltr }
- { code: fr, name: Français, dir: ltr }
- { code: ar, name: العربية, dir: rtl, fontSet: arabic, fixture: true }
```

- Every page sets `lang` and `dir` from the locales file.
- CSS uses logical properties only (`margin-inline-start`, `padding-block`, `inset-inline-end`, `text-align: start`), enforced by stylelint, so regions, the block grid and asymmetric layouts mirror automatically.
- Directional icons flip with `:dir(rtl)`; logos, the kamon, checkmarks and media controls do not, and the theme marks which is which.
- Text of unknown direction, such as titles in listings and author names, is wrapped in `<bdi>` or given `dir="auto"`, and code blocks are always left-to-right.
- An Arabic companion font (Noto Naskh Arabic with the Mincho set; IBM Plex Sans Arabic or Vazirmatn with the Gothic and Hyperlegible sets) is selected per character with `unicode-range`. Arabic text gets no letter-spacing, no faux italics, and a slightly larger size and line height.
- Dates and numbers are formatted with `Intl.DateTimeFormat` and `Intl.NumberFormat`.
- The fixture covers a home page, a section, a page with blocks, a listing and a page with mixed-direction text, is built in CI, and stays out of the production language switcher until real, human-translated content exists.

## Embedded HTML and text formats

Raw HTML in Markdown is presentation leaking into content, so it is escaped by default. A sanitizer may allow a short list of inline tags (`abbr`, `kbd`, `sub`, `sup`, `details`) with no `style` or `class` attributes. The Markdown template engine is disabled for `content/`, so template syntax in an editor's text is never executed.

| Editors want | They use |
| --- | --- |
| Columns, cards, side-by-side layout | Grid and teaser blocks |
| Callouts: note, warning, tip | Fenced containers (`::: note`) rendered by a theme partial |
| Video, map or other embeds | An embed block with a URL field |
| Figures with captions | An image block |
| Collapsible sections | A `::: details` container |

Text formats inside code fences are content and are rendered by handlers in `fences/`. Mermaid diagrams are rendered to inline SVG at build time, cached by a hash of their source, with `accTitle` and `accDescr` required and the source kept in a `<details>` element as a fallback. An unknown fence language falls back to a normal code block. A build-time linter warns about raw HTML and missing diagram descriptions.

## Sveltia CMS compatibility

The layout works with Sveltia. Sveltia is a Git-based CMS that reads and writes only the folders and files its configuration names (<a id="cite-sveltia"></a>[Sveltia, n.d.](#ref-sveltia)), so a `themes/` folder it is never pointed at is invisible to it.

| Sveltia setting | Points to | Notes |
| --- | --- | --- |
| Folder collections | `content/{locale}/<section>/` | One collection per top-level section, matching the main menu |
| File collections | `content/{locale}/_site/*.md`, `_data/navigation/`, `_data/site.yaml` | "Site text" for editors, using the locale tag in file paths |
| `i18n` structure | `multiple_folders` | Matches the language-first paths |
| `media_folder` and `public_folder` | `media/` and `/media` | Never inside the theme |
| Block fields | A variable-type list matching the partials in `blocks/` | Definitions come from the theme's `cms/` fragments |

Caveats:

- **One configuration file.** We plan for a single Sveltia configuration, so theme field fragments in `cms/` are merged into `admin/config.yml` by a build script.
- **Block names are a contract.** A renamed or removed block type leaves existing content without a partial, so the build fails on an unknown type.
- **No editing of theme defaults.** Sveltia never points at `themes/`; site data in `_data/` overrides the defaults.
- **Preview fidelity.** Sveltia's preview does not run Eleventy or render Mermaid, so editors rely on a deploy preview for the final view.

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

1. Skeleton: repository layout, site override pattern, base layout with regions, site text, and `en`, `fr` and `ar` fixtures.
2. Folders, navigation and breadcrumbs.
3. Blocks and views.
4. Font sets and the type system.
5. Sveltia configuration and the `cms/` merge.
6. Fences, starting with Mermaid build-time rendering.

Each phase ends with a clean build of all three locales.

## Open questions

- [ ] **What does Sveltia edit when content comes from SAT egress?** Option 1: Sveltia edits SAT content directly and egress runs in CI after each commit. Option 2: Sveltia owns some content types in the site repository and egress never touches those folders. Option 3: two-way sync with an ingress step, the most flexible and the most fragile. Option 1 or 2 is preferred for non-technical editors; the decision also belongs in the SAT config cascade specification.
- [ ] **Which Mincho and Gothic fonts?** Shippori Mincho or Zen Old Mincho; BIZ UDPGothic or Zen Kaku Gothic New. Decide from rendered specimens in the fixture site.
- [ ] **Atkinson Hyperlegible or Atkinson Hyperlegible Next?** The newer family adds weights and language coverage; check before locking in the existing files.
- [ ] **Which Arabic companion fonts?** Noto Naskh Arabic, IBM Plex Sans Arabic or Vazirmatn, chosen with an Arabic reader's review.
- [ ] **Which digits on Arabic pages?** Arabic-Indic or Western (`ar-u-nu-latn`), depending on the audience.
- [ ] **Does Sveltia edit right-to-left fields properly?** Test with the `ar` locale before relying on it.
- [ ] **How do Mermaid diagrams behave on right-to-left pages?** Mermaid's right-to-left support is limited; diagrams may keep a left-to-right flow with translated labels.
- [ ] **Which Eleventy version do we target?** Version 3 is stable and version 4 is in pre-release; `theme.yaml` records the supported range.
- [ ] **Mermaid rendering in CI.** Build-time rendering needs a headless browser; confirm the cache-by-hash approach keeps it out of routine builds.
- [ ] **Does Sveltia accept several configuration files or custom editor components?** Either would simplify the `cms/` merge and give editors buttons for callouts and embeds.
- [ ] **How do client sites consume the theme?** A git submodule, an npm package, or a copied folder with its version recorded in `theme.yaml`.
- [ ] **What is the minimum block set for version 1?** Proposed: text, image, teaser, listing, grid, embed, call to action.

## References

<a id="ref-eleventy-config"></a>Eleventy. (n.d.-a). *Configuration*. Retrieved October 28, 2026, from https://www.11ty.dev/docs/config/
[Return to citation](#cite-eleventy-config)

<a id="ref-eleventy-2307"></a>Eleventy. (n.d.-b). *Allow plugins to provide layouts and includes* (Issue No. 2307) [GitHub issue]. GitHub. Retrieved October 28, 2026, from https://github.com/11ty/eleventy/issues/2307
[Return to citation](#cite-eleventy-2307)

<a id="ref-sveltia"></a>Sveltia. (n.d.). *Sveltia CMS* [Computer software]. GitHub. Retrieved October 28, 2026, from https://github.com/sveltia/sveltia-cms
[Return to citation](#cite-sveltia)
