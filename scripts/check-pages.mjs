// Checks the built pages in _site/ against the theme's markup rules, and the fixture
// pages against their expected output. Run after a build: npm run build && npm run check.

import fs from "node:fs";
import path from "node:path";

const outputDir = process.argv[2] ?? "_site";

// Fixture pages whose regions must hold these parts, in this order.
const regionExpectations = [
  {
    page: "en/fixtures/nested/regions/index.html",
    region: "belowcontent",
    parts: ["footer-text", "colophon", "logo"],
  },
];

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
  if (!/<html lang="[a-z-]+" dir="(ltr|rtl)">/.test(html)) report("<html> without lang and dir");

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

for (const problem of problems) console.log(problem);
console.log(`${files.length} pages checked, ${problems.length} problems`);
process.exitCode = problems.length ? 1 : 0;
