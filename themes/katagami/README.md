# Katagami theme

A Plone-inspired Eleventy theme with a vintage Japanese, minimalist style. See the repository README and `en/docs/dev/katagami-theme-goals.md` for the specification.

## Using the theme

The site's `eleventy.config.js` sets the directories, since plugins cannot, then adds this plugin and re-exports its `config` object, which disables template syntax in Markdown:

```js
import katagami from "./themes/katagami/index.js";
export { config } from "./themes/katagami/index.js";

export default function (eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_layouts");
  eleventyConfig.addWatchTarget("site/");
  eleventyConfig.addWatchTarget("themes/katagami/");
  eleventyConfig.addPlugin(katagami);
}
```

## What the plugin provides

- Templates resolved from `site/` first, then this folder, with caching off.
- A virtual stub in `_layouts/` for each file in `layouts/`, so pages use `layout: page.njk` or `layout: section.njk`.
- YAML data files, a computed `dir` for every page from its `lang` and `_data/locales.yaml`, and a `katagami` global with the manifest, default regions, interface strings and per-language site text from `{lang}/_site/*.md`.
- A computed `eleventyNavigation` entry for every page in a language folder, with the Eleventy Navigation plugin registered.
- Filters: `t` for interface strings, `regionParts` for the parts in a region, `translationUrl` for a page's translation, `localeFor` for a locale's settings, `folderItems` for the pages in a folder, `markdown` for Markdown fields, and `formatDate` for dates.
- A language chooser at `/`, unless the site has its own root `index` page.
- A linter that warns about raw HTML in Markdown.
- Block and view partials looked up by name, with a placeholder and warning for unknown names in development and a failed build in production.
- Build-time image processing for every `<img>`, configured in `theme.yaml` under `images`, with processed files cached in `.cache/katagami/img/`.
- Passthrough copies of `assets/` to `/assets/`, of the site's `admin/`, and of `media/` except raster images, which are published only as processed files.

Nunjucks must be the same copy Eleventy uses, `@11ty/nunjucks`, or rendered Markdown is escaped twice. The repository's `package.json` aliases `nunjucks` to it.
