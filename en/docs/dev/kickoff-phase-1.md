# Kickoff prompt: phase 1

Paste the prompt below into Claude Code from an empty `eleventy-theme-katagami` directory, after copying `CLAUDE.md` to the repository root and the specification to `en/docs/dev/katagami-theme-goals.md`.

```text
Read CLAUDE.md and en/docs/dev/katagami-theme-goals.md, then build phase 1 of the Katagami theme: the skeleton.

Scope for this phase:

1. Initialise the repository: package.json (ESM, Eleventy 3), .gitignore, README.md, LICENSE.md and CHANGELOG.md, with npm scripts for build, start (serve with watch) and lint. Leave en/docs/ as it is.

2. Set up the site override pattern exactly as described under "Site overrides" in the specification:
   - eleventy.config.js sets the input to "src", includes to an empty "_includes" inside src/, layouts to a virtual "_layouts", watches site/ and themes/katagami/, and loads themes/katagami/index.js.
   - themes/katagami/index.js registers a Nunjucks environment whose loader searches site/ then themes/katagami/ (paths relative to the repository root) with caching off, a virtual stub in _layouts/ for each file in themes/katagami/layouts/, and passthrough copy of themes/katagami/assets/ to /assets/.

3. Create the theme skeleton in themes/katagami/:
   - theme.yaml manifest.
   - layouts/base.njk with named regions (header, abovecontent, content, belowcontent, footer) rendered from region data, and page.njk and section.njk extending it.
   - parts/ for skip-links, logo, main-nav (a placeholder list from src/_data/navigation), language-switcher, breadcrumbs (placeholder), footer-text, site-actions and colophon.
   - defaults/regions.yaml and i18n/en.yaml, fr.yaml and ar.yaml for interface strings such as "Skip to content".
   - assets/css/theme.css importing tokens.css, base.css, grid.css and components.css, using logical properties only, with a minimal grid for the regions.

4. Create the fixture site in src/:
   - src/_data/locales.yaml with en, fr and ar (ar has dir: rtl and fixture: true), src/_data/site.yaml and src/_data/regions.yaml.
   - Directory data files for each locale folder that set lang and dir from the locale.
   - src/{en,fr,ar}/index.md and one section with an index.md and two child pages per locale, plus src/{lang}/_site/footer.md and colophon.md, which are never published as pages but rendered into the footer region.
   - For ar, write short Arabic text and include one page mixing Arabic with an English product name, a URL and numbers.
   - src/admin/ and src/media/ as empty placeholders, passed through to the output.
   - One override in site/ (site/parts/colophon.njk) proving that shadowing works.

5. Configure Markdown: raw HTML escaped, the Markdown template engine disabled for content in src/.

6. Add stylelint with a rule rejecting physical properties, and an Eleventy linter that warns about raw HTML in Markdown.

Out of scope for this phase: navigation trees, real breadcrumbs, blocks, views, font sets, Sveltia, fences and Mermaid. Use system fonts for now.

Done when npm run build and npm run lint pass with no warnings, the site/ override appears in the output, ar pages render right-to-left with the regions mirrored, pages publish at /en/, /fr/ and /ar/ paths, _site/ contains no theme templates, no documentation pages and no _site snippet pages, and CHANGELOG.md records phase 1. Then stop and summarise what you built, anything that deviated from the specification, and questions for phase 2.
```

If the existing `themes/vishpala` folder is available, it is worth copying its Atkinson Hyperlegible font files and `font-preference.js` into `themes/katagami/assets/` before phase 4, rather than sourcing them again.
