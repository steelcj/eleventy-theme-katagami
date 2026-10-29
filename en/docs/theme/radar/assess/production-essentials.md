---
title: "Katagami: Production Essentials"
description: "Parts of the Katagami theme that are specified but not yet built, assessed for a production-essentials phase that would make the theme ready for a first client site."
date: 2026-10-29
version: 0.1.0
lang: en
author: Christopher Steel
status: assess
---

# Katagami: Production Essentials

Release 0.5.1 completes phases 1 to 5 of the Katagami specification, but several parts the specification describes are not yet built. Some are basics that any production site needs, so the theme is a solid development milestone rather than something a client site can launch on. This document assesses those parts and proposes a short production-essentials phase, ahead of fences and the CMS adapter.

## Proposed phase: production essentials

These items are small, mostly independent of each other, and needed before a first client site goes live.

| Item | Why it is needed | Done when |
| --- | --- | --- |
| 404 page | Every host serves one for missing pages; without it readers see the host's default page, out of the site's style and language | A translated 404 page per locale, using the base layout, with links to the home page and site search once search exists; the host configuration for serving it is documented |
| Sitemap | Search engines use it to find every page, including translations | `sitemap.xml` lists every published page with its `hreflang` alternates, excludes fixture locales in production, and validates against the sitemap schema |
| Robots file | Hosts and crawlers expect it, and it points crawlers to the sitemap | `robots.txt` references the sitemap; development and preview builds disallow all crawling |
| Feed | Readers and other sites follow news and events through feeds | An Atom feed per locale for dated content, linked from each page's head, with plain-text titles and absolute URLs |
| JSON content index | The specification's portable-output goal: content and metadata in a form that can move to another system without loss | One JSON file per build with every page's identifier, locale, path, title, description, dates, navigation fields, blocks and body source, validated in `npm run check` |
| Inline-tag sanitizer | Raw HTML is currently escaped entirely; the specification allows a short list of inline tags | `abbr`, `kbd`, `sub`, `sup` and `details` pass through with no attributes except those each tag needs; everything else stays escaped; `npm run check` confirms no `style` or `class` attribute reaches the output from content |
| Containers | Editors need callouts and collapsible sections without HTML | `::: note`, `::: warning`, `::: tip` and `::: details Summary` render through theme partials, with translated labels and correct direction in Arabic |

Each item ends with the usual definition of done: a clean build of all three locales, lint, `npm run check` and `npm run check:browser` passing, and a `CHANGELOG.md` entry.

## Later, as client needs arise

These parts are planned in the theme directory but are not essential for a first launch. Each can be built when a client site calls for it.

| Item | Notes |
| --- | --- |
| Announcement banner | The `announcement` part above the header, filled from `src/{lang}/_site/announcement.md`, hidden when the file is absent or empty |
| Site search | The `site-search` part; a build-time index with a small client-side search that works on low bandwidth, and a plain link to the sitemap or a search page when JavaScript is unavailable |
| Byline | The `byline` part below the title: author and dates, formatted with `Intl.DateTimeFormat` |
| Related items | The `related-items` part below the content, from a related-items field |
| Home and service layouts | `home.njk` and `service.njk`, extending the base layout |
| Fallback navigation | `defaults/navigation.yaml`, so a site without a main menu file still gets one from its top-level folders |

## Still deferred

These remain deferred, for the reasons recorded in the specification:

- the CMS adapter and the theme's field fragments
- fences, including build-time Mermaid diagrams
- the embed block, which needs a load-on-request design to avoid third-party requests
- localized folder names, with translations paired by a shared `urn:uuid` identifier
- redirects from old URLs when a file or folder is renamed

## Recommendation

Adopt the production-essentials phase as the next phase of the specification, numbered ahead of fences and the CMS adapter. Build the JSON content index and the sanitizer first: the index carries the portability goal, and the sanitizer completes the rule that content holds no presentation markup. The remaining items can be built in any order.
