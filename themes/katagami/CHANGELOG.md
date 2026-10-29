# Changelog

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
