// Checks the built site in a real browser: the reader's font set switch, which fonts each
// page downloads, and the page without JavaScript. Uses the Chromium that Playwright
// installs (npx playwright install chromium), not the system browser. Run after a build:
// npm run build && npm run check:browser

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const outputDir = path.resolve(process.argv[2] ?? "_site");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".woff2": "font/woff2",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

// A static server for _site/, so the check needs nothing else running.
const server = http.createServer((request, response) => {
  let file = path.join(outputDir, decodeURIComponent(new URL(request.url, "http://localhost").pathname));
  if (!file.startsWith(outputDir)) file = outputDir;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const problems = [];
const expect = (condition, message) => {
  if (!condition) problems.push(message);
};

const browser = await chromium.launch();

// Opens a page and returns it with the font files it downloaded.
async function open(context, url) {
  const page = await context.newPage();
  const fonts = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".woff2")) fonts.push(path.basename(new URL(request.url()).pathname));
  });
  await page.goto(origin + url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { page, fonts };
}

const fontSetOf = (page) => page.evaluate(() => document.getElementById("font-set").getAttribute("href"));
const headingFont = (page) => page.evaluate(() => getComputedStyle(document.querySelector("h1")).fontFamily);

// The font set switch: default set, a new choice, and the choice after a reload.
{
  const context = await browser.newContext();
  const url = "/fr/services/conception/";
  let { page, fonts } = await open(context, url);
  expect(await page.isVisible("[data-ui-options]"), "font set control is not shown with JavaScript");
  expect((await fontSetOf(page)) === "/assets/css/fonts/hyperlegible.css", "default font set is not hyperlegible");
  expect(fonts.every((file) => file.startsWith("atkinson-hyperlegible-next-")), `default set downloaded other fonts: ${fonts.join(", ")}`);

  await page.selectOption("[data-font-set-choice]", "mincho");
  await page.evaluate(() => document.fonts.ready);
  expect((await headingFont(page)).startsWith('"Shippori Mincho"'), "choosing mincho did not change the heading font");
  await page.close();

  ({ page, fonts } = await open(context, url));
  expect((await fontSetOf(page)) === "/assets/css/fonts/mincho.css", "the font set choice did not persist after a reload");
  expect((await page.inputValue("[data-font-set-choice]")) === "mincho", "the control does not show the chosen set");
  expect(fonts.some((file) => file.startsWith("shippori-mincho-")), "Shippori Mincho was not downloaded after choosing mincho");
  await context.close();
}

// English and French pages never download an Arabic font, even with Arabic language names
// in the switcher; Arabic pages use the Arabic companion.
{
  const context = await browser.newContext();
  for (const url of ["/en/", "/fr/", "/en/services/design/"]) {
    const { fonts } = await open(context, url);
    expect(!fonts.some((file) => file.includes("arabic")), `${url} downloaded an Arabic font: ${fonts.join(", ")}`);
  }
  const { page, fonts } = await open(context, "/ar/");
  expect(fonts.some((file) => file.startsWith("ibm-plex-sans-arabic-")), "/ar/ did not download IBM Plex Sans Arabic");
  expect((await page.evaluate(() => getComputedStyle(document.body).fontFamily)).includes("IBM Plex Sans Arabic"), "/ar/ body text does not use the Arabic companion");
  await context.close();
}

// Vertical rhythm: every heading, paragraph, list item, caption and table cell starts a
// whole number of baselines below the page title, in every font set, at phone and
// desktop widths, in Latin and Arabic text. Images, cards and rules may sit off the grid
// themselves, but the text after them must return to it. The only allowance is 0.3px,
// for sub-pixel rounding.
const rhythmPages = [
  "/fr/fixtures/typographie/",
  "/ar/fixtures/typography/",
  "/en/",
  "/ar/",
  "/en/services/",
  "/en/services/design/",
  "/en/services/workshops/",
  "/ar/services/software/",
  "/en/fixtures/tables/",
];
for (const set of ["hyperlegible", "mincho", "gothic"]) {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript((choice) => localStorage.setItem("katagami-font-set", choice), set);
    for (const url of rhythmPages) {
      const { page } = await open(context, url);
      const off = await page.evaluate(() => {
        const baseline = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--baseline")) * 16;
        const main = document.querySelector("main");
        const top = main.querySelector("h1").getBoundingClientRect().top;
        return [...main.querySelectorAll("h1, h2, h3, h4, p, li, figcaption, th, td")]
          .filter((element) => element.getClientRects().length)
          .map((element) => ({ element, px: element.getBoundingClientRect().top - top }))
          .filter(({ px }) => Math.abs(px - Math.round(px / baseline) * baseline) > 0.3)
          .map(({ element, px }) => `${element.localName} at ${(px / baseline).toFixed(2)}`);
      });
      expect(off.length === 0, `${set}, ${width}px, ${url}: off the baseline grid: ${off.slice(0, 4).join("; ")}`);
      await page.close();
    }
    await context.close();
  }
}

// Without JavaScript the control stays hidden and the site's font set is used.
{
  const context = await browser.newContext({ javaScriptEnabled: false });
  const { page } = await open(context, "/en/");
  expect(!(await page.isVisible("[data-ui-options]")), "font set control is shown without JavaScript");
  expect((await fontSetOf(page)) === "/assets/css/fonts/hyperlegible.css", "the site's font set is not used without JavaScript");
  await context.close();
}

await browser.close();
server.close();

for (const problem of problems) console.log(problem);
console.log(`browser checks: ${problems.length} problems`);
process.exitCode = problems.length ? 1 : 0;
