# CLAUDE.md

Standing rules for Claude Code sessions in `eleventy-theme-katagami`. Read `en/docs/dev/katagami-theme-goals.md` for the full specification; this file holds the rules that apply to every change.

## Project

Katagami is a Plone-inspired Eleventy theme with a vintage Japanese, minimalist style, built by Vishpala. The theme lives in `themes/katagami/`. A demo and fixture site in `src/` doubles as the theme's test suite, with content in English (`en`), French (`fr`) and an Arabic right-to-left fixture (`ar`). Project documentation lives in `en/docs/`.

## Architecture

- Eleventy 3, ESM configuration, Nunjucks templates.
- The input directory is `src/`, which holds site content only. The includes directory is an empty `src/_includes`, global data is `src/_data`, and the layouts directory is a virtual `_layouts`.
- `themes/`, `site/` and `en/docs/` sit outside `src/`, so Eleventy never builds them as pages.
- The site's `eleventy.config.js` sets directories only, re-exports the theme's `config`, then loads `themes/katagami/index.js`, which registers everything else. An optional `site/index.js` adds site-only build code after the theme and never sets directories.
- Site overrides live in `site/` and shadow theme files of the same name. A Nunjucks loader searches `site/` before `themes/katagami/` with caching off; its paths are relative to the repository root. Each theme layout, and each layout only `site/layouts/` has, gets a virtual stub in `_layouts/` containing only `{% extends "layouts/<name>.njk" %}`.
- `site/` and `themes/katagami/` are added as watch targets. Theme assets are copied from `themes/katagami/assets/` to `/assets/`, and `src/media/` is passed through.

## Rules

- Layouts chain with `{% extends %}` and named blocks. Never put front-matter `layout:` inside a layout file.
- Content holds text formats only: Markdown, Mermaid, CSV. No raw HTML, no class names, no inline styles in `src/`. Raw HTML is escaped; the Markdown template engine is disabled for content.
- Regions are filled from data (`_data/regions.yaml`, falling back to `themes/katagami/defaults/regions.yaml`), never hard-coded in layouts.
- CSS uses logical properties only (`margin-inline-start`, `padding-block`, `inset-inline-end`, `text-align: start`). Physical properties such as `margin-left` or `text-align: left` fail stylelint.
- All colours, spacing, type sizes and fonts come from custom properties in `assets/css/tokens.css` and the font set files. Templates never set a font family directly.
- Fonts are self-hosted WOFF2 under the SIL Open Font License, subset to Latin and Latin Extended by default and to Arabic for the Arabic companions, with `font-display: swap`. They are copied by `npm run vendor-fonts` from exact versions in `theme.yaml`, and Fluid Infusion by `npm run vendor-infusion`. No font CDNs, no third-party requests at runtime.
- No client-side rendering where build-time rendering is possible. Keep JavaScript small and optional; every page must work without it.
- File, folder and package names are ASCII and kebab-case. Code names for parts, blocks and views are plain English (`header`, `grid`, `footer-text`); Japanese vocabulary belongs in the theme name and documentation only.
- Every page sets `lang` and `dir` from `_data/locales.yaml`. Text of unknown direction gets `<bdi>` or `dir="auto"`; code blocks are always `dir="ltr"`.
- Directional icons flip under `:dir(rtl)`; logos, the kamon, checkmarks and media controls do not.
- The `ar` locale is a fixture: it builds everywhere but is excluded from the production language switcher and language chooser, until an Arabic reader has reviewed it (see Arabic reader's review in the specification).

## Definition of done

A change is done when:

- `npm run build` completes with no errors or warnings for `en`, `fr` and `ar`.
- `npm run lint` passes, including stylelint's logical-property rule.
- `npm run check` and `npm run check:browser` pass. For changes to docs, data, content or build logic, these automated checks are enough.
- For changes to layouts, partials, CSS or fonts, screenshots at a phone width and a desktop width, in English and Arabic, are also saved to `.cache/katagami/review/` and reviewed before the change counts as done. The browser check confirms the baseline grid, fonts, contrast and accessibility rules, but not whether a layout looks right or the typography reads well. Say where the screenshots are, so they can be reviewed too.
- `CHANGELOG.md` records the change.

## Documentation style

Markdown documents in this repository follow the house style:

- Commas rather than em dashes.
- No heading numbers and no horizontal rules in content.
- No hard line wraps in prose.
- APA 7 citations using Citation Anchor Pairs: an in-text anchor `<a id="cite-…"></a>` before a link to the reference, and each References entry starting with `<a id="ref-…"></a>`, followed on the next line by `[Return to citation](#cite-…)`.

## Working style

- Work in the phases set out in the specification, and stop for review at the end of each phase. Phases 1 to 5 are done and production essentials is next; the CMS adapter and fences are deferred, so start neither without a decision.
- Prefer the smallest change that keeps every locale building.
- When a decision listed under Open questions in the specification is needed, propose options with trade-offs and wait for a decision rather than choosing silently.
