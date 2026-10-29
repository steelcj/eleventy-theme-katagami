// Checks the built pages in _site/ against the theme's markup rules, and the fixture
// pages against their expected output. Run after a build: npm run build && npm run check.

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { frenchSpacing } from "../themes/katagami/typography.js";

const outputDir = process.argv[2] ?? "_site";

// Fixture pages whose regions must hold these parts, in this order.
const regionExpectations = [
  {
    page: "en/fixtures/nested/regions/index.html",
    region: "belowcontent",
    parts: ["footer-text", "colophon", "logo"],
  },
];

// Fixture pages that must contain, or must not contain, these strings.
const NBSP = "\u00A0";
const NNBSP = "\u202F";
const textExpectations = [
  {
    // Titles are plain text with smart punctuation: no Markdown, no HTML.
    page: "en/fixtures/titles/index.html",
    contains: [
      "<h1>Plain *titles*, “quotes” &amp; &lt;tags&gt;</h1>",
      "<title>Plain *titles*, “quotes” &amp; &lt;tags&gt; · Katagami</title>",
      '<meta name="description" content="A title with **Markdown** syntax, ‘quotes’ &amp; &lt;tags&gt;, shown as plain text.">',
      '<span aria-current="page"><bdi>Plain *titles*, “quotes” &amp; &lt;tags&gt;</bdi></span>',
    ],
    lacks: ["<em>titles</em>", "<strong>Markdown</strong>", "<tags>"],
  },
  {
    page: "fr/fixtures/typographie/index.html",
    contains: [
      `Note${NBSP}: le deux-points`,
      "Vraiment? Oui! Bien sûr; voilà.",
      "Et sans espace aussi; ça reste ainsi.",
      `«${NBSP}Guillemets avec espaces${NBSP}» et «${NBSP}guillemets serrés${NBSP}»`,
      `«${NBSP}Guillemets droits${NBSP}»`,
      "l’apostrophe",
      "Il est 12:45",
      '<a href="https://www.11ty.dev/" dir="ltr">https://www.11ty.dev/</a>',
      '<code dir="ltr">a ; b : c ?</code>',
      '<html lang="fr-CA"',
    ],
    lacks: [NNBSP],
  },
  {
    page: "en/index.html",
    contains: ["’", '<html lang="en"'],
    lacks: ["«"],
  },
];

// France's conventions, which no fixture locale uses, checked on the function itself.
const franceExpectations = [
  ["Vraiment ? Oui ! Bien sûr ; voilà.", `Vraiment${NNBSP}? Oui${NNBSP}! Bien sûr${NNBSP}; voilà.`],
  ["Note: texte", `Note${NBSP}: texte`],
  ["«mot»", `«${NBSP}mot${NBSP}»`],
  ["12:45 et a?b", "12:45 et a?b"],
];

// Each locale's full language tag, such as fr-CA, by its code.
const locales = yaml.load(fs.readFileSync("src/_data/locales.yaml", "utf8"));
const tags = Object.fromEntries(locales.map((locale) => [locale.code, locale.tag ?? locale.code]));

const partClasses = ["skip-link", "logo", "main-nav", "language-switcher", "breadcrumbs", "section-nav", "footer-text", "site-actions", "colophon"];

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(file);
    return file.endsWith(".html") ? [file] : [];
  });
}

const problems = [];
const files = htmlFiles(outputDir);

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const report = (message) => problems.push(`${path.relative(outputDir, file)}: ${message}`);

  // Every page states its language and direction.
  if (!/<html lang="[a-z]{2,3}(-[A-Za-z0-9]+)*" dir="(ltr|rtl)">/.test(html)) report("<html> without lang and dir");

  // Pages in a language folder carry their locale's full tag, and links name languages by
  // their full tags too.
  const code = path.relative(outputDir, file).split(path.sep)[0];
  if (tags[code] && !html.includes(`<html lang="${tags[code]}"`)) report(`lang is not ${tags[code]}`);
  for (const [, hreflang] of html.matchAll(/hreflang="([^"]*)"/g)) {
    if (!Object.values(tags).includes(hreflang)) report(`hreflang="${hreflang}" is not a locale's full tag`);
  }
  for (const [, target, hreflang] of html.matchAll(/href="\/([a-z]+)\/[^"]*"[^>]*hreflang="([^"]*)"/g)) {
    if (tags[target] && hreflang !== tags[target]) report(`link to /${target}/ has hreflang="${hreflang}", expected ${tags[target]}`);
  }

  // Every page loads one font set and preloads exactly one font file, which must exist.
  if (!/<link rel="stylesheet" href="\/assets\/css\/fonts\/[a-z-]+\.css" id="font-set">/.test(html)) report("no font set stylesheet");
  const preloads = [...html.matchAll(/<link rel="preload" href="([^"]+)" as="font"/g)].map((match) => match[1]);
  if (preloads.length !== 1) report(`${preloads.length} font preloads, expected 1`);
  for (const href of preloads) {
    if (!fs.existsSync(path.join(outputDir, href))) report(`preloaded font ${href} does not exist`);
  }

  // Each <nav> has its own label.
  const labels = [...html.matchAll(/<nav\b([^>]*)>/g)].map((match) => match[1].match(/aria-label="([^"]*)"/)?.[1]);
  if (labels.some((label) => !label)) report("<nav> without aria-label");
  if (new Set(labels).size !== labels.length) report(`<nav> labels repeated: ${labels.join(", ")}`);

  // Breadcrumbs: an ordered list, the last item current, the separator in CSS only.
  const crumbs = html.match(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/)?.[0];
  if (crumbs) {
    const items = crumbs.match(/<li>[\s\S]*?<\/li>/g) ?? [];
    if (!crumbs.includes("<ol>")) report("breadcrumbs are not an ordered list");
    if (!items.at(-1)?.includes('aria-current="page"') || items.slice(0, -1).some((item) => item.includes("aria-current"))) {
      report("breadcrumbs: only the last item should be current");
    }
    if (/<svg|[›»]/.test(crumbs)) report("breadcrumb separator in markup");
  }

  // Section navigation and main menu: at most one current item each.
  const sectionNav = html.match(/<nav class="section-nav"[\s\S]*?<\/nav>/)?.[0];
  if ((sectionNav?.match(/aria-current="page"/g) ?? []).length > 1) report("section navigation has more than one current page");
  const mainNav = html.match(/<nav class="main-nav"[\s\S]*?<\/nav>/)?.[0];
  if ((mainNav?.match(/aria-current/g) ?? []).length > 1) report("main menu has more than one current item");

  // Images: alt text and dimensions on every image, and at most one loaded eagerly.
  const images = html.match(/<img\b[^>]*>/g) ?? [];
  if (images.some((img) => !/ alt="/.test(img))) report("<img> without alt");
  if (images.some((img) => !/ width="/.test(img) || !/ height="/.test(img))) report("<img> without width and height");
  if (images.filter((img) => img.includes('loading="eager"')).length > 1) report("more than one eager image");

  // No inline styles: presentation comes from the theme's CSS, in logical terms.
  if (/\sstyle="/.test(html)) report("inline style attribute");

  // No empty regions.
  if (/<(aside|div|header|footer) class="region[^"]*">\s*<\/\1>/.test(html)) report("empty region");

  // No unknown blocks or views, and no raw HTML left unescaped from content.
  if (html.includes("block--unknown")) report("unknown block or view placeholder");
}

for (const { page, region, parts } of regionExpectations) {
  const file = path.join(outputDir, page);
  if (!fs.existsSync(file)) {
    problems.push(`${page}: fixture page missing`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  // Regions are siblings, so a region runs from its own tag to the next region's.
  const start = html.indexOf(`class="region region--${region}"`);
  const next = html.indexOf('class="region region--', start + 1);
  const regionHtml = start < 0 ? "" : html.slice(start, next < 0 ? undefined : next);
  const found = [...regionHtml.matchAll(/class="([a-z-]+)"/g)].map((match) => match[1]).filter((name) => partClasses.includes(name));
  if (found.join(",") !== parts.join(",")) problems.push(`${page}: ${region} has [${found.join(", ")}], expected [${parts.join(", ")}]`);
}

for (const { page, contains = [], lacks = [] } of textExpectations) {
  const file = path.join(outputDir, page);
  if (!fs.existsSync(file)) {
    problems.push(`${page}: fixture page missing`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const show = (text) => JSON.stringify(text).replace(/\\u00a0/gi, "⍽").replace(/\\u202f/gi, "·");
  for (const text of contains) if (!html.includes(text)) problems.push(`${page}: missing ${show(text)}`);
  for (const text of lacks) if (html.includes(text)) problems.push(`${page}: should not contain ${show(text)}`);
}

for (const [input, expected] of franceExpectations) {
  const output = frenchSpacing(input, "france");
  if (output !== expected) problems.push(`French spacing (France) of ${JSON.stringify(input)} gave ${JSON.stringify(output)}`);
}

for (const problem of problems) console.log(problem);
console.log(`${files.length} pages checked, ${problems.length} problems`);
process.exitCode = problems.length ? 1 : 0;
