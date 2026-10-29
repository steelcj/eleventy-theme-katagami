# Changelog

## [Unreleased]

## [0.5.0] - 2026-10-29

### Added

- Reader preferences with Fluid Infusion UI Options, vendored and loaded on demand: text size, line spacing, fonts and contrast, mapped onto the theme's tokens, kept in local storage, applied before the page is drawn, with a fixed "Display preferences" button and a translated message if Infusion cannot load.
- High-contrast and dark schemes, chosen by the reader or by their system settings.
- A minimum Content Security Policy in `assets/csp.json`, with hashes for the head script and Infusion's one style.

### Changed

- The baseline is rounded to a whole pixel; the font select from 0.4.0 is replaced by the panel.

## [0.4.0] - 2026-10-28

### Added

- Plain-text titles with smart punctuation, through the `typeset` filter, in headings, the page title, meta descriptions and navigation.
- Image ratio classes and `assets/css/image-ratios.css`, generated at build time, so images in the text flow keep the baseline grid.
- The type system: modular scale, baseline rhythm, wrapping, tabular figures, and small caps only where fonts have them.
- `typography.js`: quotation marks by language and French spacing by locale tag, for Markdown and, through the `typeset` filter, for titles and other plain-text fields. Locales may set a `tag`, exposed as `langTag`.
- Font sets Hyperlegible, Mincho and Gothic, generated from `theme.yaml` with their Arabic companions, self-hosted WOFF2 subsets and OFL licences, one preloaded font per page, and a reader's choice through the `ui-options` part and `font-preference.js`.
- Stubs for site-only layouts in `site/layouts/`, and `site/index.js` added as a plugin after the theme when present.
- Base table styles and Markdown table alignment as `data-align`, styled with logical CSS.

### Changed

- `block-list`, `picture` and `lead-image` moved to `partials/`; `parts/` holds only region items.
- Section navigation does not render when every page in the section is hidden.

## [0.3.0] - 2026-10-28

### Added

- Blocks: text, image, teaser, listing, grid and call to action.
- Views: listing, summary, tabular and album.
- Build-time image processing with a cache, lead images, and required alt text.

### Changed

- Section navigation leaves the current folder closed.
- Empty regions are not rendered.

## [0.2.0] - 2026-10-28

### Added

- Navigation tree from folders, with `menuTitle`, `order` and `excludeFromNav`.
- Breadcrumbs, the `section-nav` part and a `sidebar` region.
- `regionOverrides` for folders and pages.
- Translation links in the language switcher, and a language chooser at the site root.

## [0.1.0] - 2026-10-28

### Added

- Plugin with site-first template loader, virtual layout stubs, Markdown setup, raw HTML linter and asset passthrough.
- Base, page and section layouts with data-driven regions.
- Parts: skip links, logo, main navigation, language switcher, breadcrumbs (placeholder), footer text, site actions and colophon.
- Default regions, interface strings in `en`, `fr` and `ar`, and CSS with logical properties only.
