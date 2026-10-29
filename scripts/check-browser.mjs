// Checks the built site in a real browser: the reader preferences panel and the
// preferences it saves, the panel under the site's Content Security Policy and when
// Infusion fails to load, the reader's system settings, accessibility audits with
// axe-core, which fonts each page downloads, the vertical rhythm, and the page without
// JavaScript. Uses the Chromium that Playwright
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
  ".json": "application/json",
  ".woff": "font/woff",
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
const KEY = "katagami-preferences";

// Opens a page and returns it with the files it requested and the errors it raised.
async function open(context, url) {
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on("request", (request) => requests.push(new URL(request.url()).pathname));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(origin + url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const fonts = () => requests.filter((request) => request.endsWith(".woff2")).map((request) => path.basename(request));
  return { page, requests, errors, fonts };
}

// Opens the preferences panel, which loads Infusion the first time.
async function openPanel(page) {
  await page.click(".flc-slidingPanel-toggleButton");
  await page.waitForSelector(".flc-prefsEditor-text-font option", { state: "attached", timeout: 15000 });
  await page.waitForTimeout(500);
}

// Chooses a contrast scheme by its label, as a reader does.
async function chooseContrast(page, value) {
  const id = await page.getAttribute(`.flc-prefsEditor-themeInput[value="${value}"]`, "id");
  await page.click(`label[for="${id}"]`);
}

const stored = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "null"), KEY);
const state = (page) =>
  page.evaluate(() => ({
    fontSet: document.getElementById("font-set").getAttribute("href").match(/([a-z-]+)\.css$/)[1],
    contrast: document.documentElement.getAttribute("data-contrast"),
    textSize: document.documentElement.style.getPropertyValue("--text-size"),
    lineSpace: document.documentElement.style.getPropertyValue("--line-space"),
    background: getComputedStyle(document.body).backgroundColor || getComputedStyle(document.documentElement).backgroundColor,
    heading: getComputedStyle(document.querySelector("h1")).fontFamily,
  }));
const background = (page) => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
const WASHI = "rgb(245, 240, 230)";
const DARK = "rgb(28, 26, 23)";
const WHITE = "rgb(255, 255, 255)";

// The panel: Infusion loads only when a reader opens it, each preference applies at once
// and is saved, saved preferences apply on the next page before Infusion loads, and reset
// returns to the defaults.
{
  const context = await browser.newContext();
  let { page, requests, errors } = await open(context, "/fr/services/conception/");
  expect(await page.isVisible("[data-preferences]"), "the preferences part is not shown with JavaScript");
  expect(!requests.some((request) => request.includes("infusion")), "Infusion loaded before the panel was opened");

  await openPanel(page);
  expect(requests.some((request) => request.endsWith("infusion-uio.js")), "opening the panel did not load Infusion");
  expect(!requests.some((request) => request.includes("opensans")), "the panel requested Open Sans");
  expect((await page.textContent(".flc-prefsEditor-text-font-label")).includes("Polices"), "the French panel is not in French");

  await page.selectOption(".flc-prefsEditor-text-font", "mincho");
  await chooseContrast(page, "dark");
  await page.fill(".flc-prefsEditor-fluid_prefs_textSize .flc-textfieldStepper-field", "1.3");
  await page.press(".flc-prefsEditor-fluid_prefs_textSize .flc-textfieldStepper-field", "Enter");
  await page.click(".flc-prefsEditor-fluid_prefs_lineSpace .flc-textfieldStepper-increase");
  await page.waitForTimeout(500);
  let now = await state(page);
  expect(now.fontSet === "mincho" && now.heading.startsWith('"Shippori Mincho"'), "choosing Mincho did not change the font set");
  expect(now.contrast === "dark" && (await background(page)) === DARK, "choosing dark did not change the colours");
  expect(now.textSize === "1.3", `text size did not apply: ${now.textSize}`);
  expect(now.lineSpace === "1.1", `line spacing did not apply: ${now.lineSpace}`);
  const saved = await stored(page);
  expect(
    JSON.stringify(saved) === JSON.stringify({ version: 1, textSize: 1.3, lineSpace: 1.1, fontSet: "mincho", contrast: "dark" }),
    `saved preferences are ${JSON.stringify(saved)}`,
  );
  expect(errors.length === 0, `errors while using the panel: ${errors.join("; ")}`);
  await page.close();

  ({ page, requests, errors } = await open(context, "/en/"));
  now = await state(page);
  expect(now.fontSet === "mincho" && now.contrast === "dark" && now.textSize === "1.3" && now.lineSpace === "1.1", `saved preferences did not apply on the next page: ${JSON.stringify(now)}`);
  expect(!requests.some((request) => request.includes("infusion")), "applying saved preferences loaded Infusion");

  await page.click("[data-preferences-reset]");
  await page.waitForTimeout(300);
  now = await state(page);
  expect((await stored(page)) === null, "reset did not clear the saved preferences");
  expect(now.fontSet === "hyperlegible" && now.contrast === null && now.textSize === "" && now.lineSpace === "", `reset did not return to the defaults: ${JSON.stringify(now)}`);
  expect(errors.length === 0, `errors on the next page: ${errors.join("; ")}`);
  await context.close();
}

// The panel's button is a disclosure: its label stays the same and aria-expanded follows
// the panel.
{
  const context = await browser.newContext();
  const { page } = await open(context, "/fr/");
  const button = () =>
    page.evaluate(() => {
      const toggle = document.querySelector(".flc-slidingPanel-toggleButton");
      return { text: toggle.textContent, expanded: toggle.getAttribute("aria-expanded"), pressed: toggle.getAttribute("aria-pressed"), label: toggle.getAttribute("aria-label") };
    });
  const closed = await button();
  await openPanel(page);
  const opened = await button();
  await page.click(".flc-slidingPanel-toggleButton");
  await page.waitForTimeout(800);
  const closedAgain = await button();
  expect(closed.text === "Préférences d’affichage" && opened.text === closed.text && closedAgain.text === closed.text, `the button's label changed: ${JSON.stringify([closed, opened, closedAgain])}`);
  expect(closed.expanded === "false" && opened.expanded === "true" && closedAgain.expanded === "false", `aria-expanded does not follow the panel: ${JSON.stringify([closed, opened, closedAgain])}`);
  expect([closed, opened, closedAgain].every((state) => state.pressed === null && state.label === null), "the button has aria-pressed or aria-label");
  await context.close();
}

// Under the site's minimum Content Security Policy, from assets/csp.json, the panel loads
// and works with no violations.
{
  const policy = JSON.parse(fs.readFileSync(path.join(outputDir, "assets/csp.json"), "utf8")).policy;
  const context = await browser.newContext();
  await context.route("**/*", async (route) => {
    const response = await route.fetch();
    const headers = { ...response.headers() };
    if (route.request().resourceType() === "document") headers["content-security-policy"] = policy;
    await route.fulfill({ response, headers });
  });
  await context.addInitScript(() =>
    document.addEventListener("securitypolicyviolation", (event) => console.error(`CSP violation: ${event.violatedDirective} ${event.blockedURI || event.sample}`)),
  );
  for (const url of ["/en/services/design/", "/ar/"]) {
    const { page, errors } = await open(context, url);
    await openPanel(page);
    await page.selectOption(".flc-prefsEditor-text-font", "gothic");
    await chooseContrast(page, "dark");
    await page.waitForTimeout(300);
    const now = await state(page);
    expect(now.fontSet === "gothic" && now.contrast === "dark", `${url}: the panel did not work under the Content Security Policy`);
    expect(errors.length === 0, `${url}: errors under the Content Security Policy: ${errors.join("; ")}`);
    await page.evaluate((key) => localStorage.removeItem(key), KEY);
    await page.close();
  }
  await context.close();
}

// When Infusion cannot load, the button says so in the page's language, a status message
// announces it, and the rest of the page is unaffected.
{
  const context = await browser.newContext();
  await context.route("**/infusion-uio.js", (route) => route.abort());
  for (const [url, message] of [
    ["/fr/", "Les préférences n’ont pas pu être chargées"],
    ["/en/", "Preferences couldn’t load"],
  ]) {
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(origin + url, { waitUntil: "networkidle" });
    await page.click(".flc-slidingPanel-toggleButton");
    await page.waitForTimeout(1000);
    const result = await page.evaluate(() => ({
      button: document.querySelector(".flc-slidingPanel-toggleButton").textContent,
      status: document.querySelector("[data-preferences-status]").textContent,
      expanded: document.querySelector(".flc-slidingPanel-toggleButton").getAttribute("aria-expanded"),
      heading: document.querySelector("main h1")?.textContent,
      links: document.querySelectorAll("main a").length,
    }));
    expect(result.button === message && result.status === message, `${url}: a failed load did not show the message: ${JSON.stringify(result)}`);
    expect(result.expanded === "false" && result.heading && result.links > 0, `${url}: a failed load affected the page: ${JSON.stringify(result)}`);
    expect(pageErrors.length === 0, `${url}: errors after a failed load: ${pageErrors.join("; ")}`);
    await page.close();
  }
  await context.close();
}

// Accessibility audits with axe-core: home pages, text pages and pages with images in all
// three languages, under the site's colours, high contrast and dark, and with the panel open.
{
  const audit = async (page) => {
    await page.addScriptTag({ path: path.resolve("node_modules/axe-core/axe.min.js") });
    return page.evaluate(async () => {
      const result = await window.axe.run(document);
      return {
        passes: result.passes.length,
        violations: result.violations.map((violation) => `${violation.id} (${violation.impact}) at ${violation.nodes.map((node) => node.target.join(" ")).slice(0, 2).join(", ")}`),
      };
    });
  };
  const auditPages = ["/en/", "/fr/", "/ar/", "/en/services/archive/", "/fr/fixtures/typographie/", "/ar/fixtures/typography/", "/en/services/design/", "/fr/services/conception/", "/ar/services/design/"];
  for (const contrast of ["site", "high", "dark"]) {
    const context = await browser.newContext();
    await context.addInitScript(([key, value]) => localStorage.setItem(key, JSON.stringify({ version: 1, contrast: value })), [KEY, contrast]);
    for (const url of auditPages) {
      const { page } = await open(context, url);
      const result = await audit(page);
      expect(result.passes > 0, `axe did not run on ${url} (${contrast})`);
      expect(result.violations.length === 0, `axe, ${contrast}, ${url}: ${result.violations.join("; ")}`);
      await page.close();
    }
    await context.close();
  }
  const context = await browser.newContext();
  for (const url of ["/en/", "/ar/"]) {
    const { page } = await open(context, url);
    await openPanel(page);
    const result = await audit(page);
    expect(result.violations.length === 0, `axe, panel open, ${url}: ${result.violations.join("; ")}`);
    await page.close();
  }
  await context.close();
}

// Reset from the open panel clears the saved preferences too.
{
  const context = await browser.newContext();
  await context.addInitScript((key) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem(key, JSON.stringify({ version: 1, contrast: "high", textSize: 1.5 }));
      sessionStorage.setItem("seeded", "1");
    }
  }, KEY);
  const { page, errors } = await open(context, "/en/");
  expect((await state(page)).contrast === "high", "saved high contrast did not apply");
  await openPanel(page);
  await page.click("[data-preferences-reset]");
  await page.waitForTimeout(500);
  expect((await stored(page)) === null, "reset from the open panel did not clear the saved preferences");
  expect((await state(page)).contrast === null, "reset from the open panel did not restore the default contrast");
  expect(errors.length === 0, `errors resetting from the panel: ${errors.join("; ")}`);
  await context.close();
}

// A font set saved before version 1 moves into the new format once.
{
  const context = await browser.newContext();
  await context.addInitScript(() => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("katagami-font-set", "gothic");
      sessionStorage.setItem("seeded", "1");
    }
  });
  const { page } = await open(context, "/en/");
  expect((await state(page)).fontSet === "gothic", "the older font set choice did not apply");
  expect(JSON.stringify(await stored(page)) === JSON.stringify({ version: 1, fontSet: "gothic" }), "the older font set choice did not move into the new format");
  expect((await page.evaluate(() => localStorage.getItem("katagami-font-set"))) === null, "the older key was not removed");
  await context.close();
}

// Without storage, nothing breaks: defaults apply, and choices last for the page.
{
  const context = await browser.newContext();
  await context.addInitScript(() => {
    for (const method of ["getItem", "setItem", "removeItem"]) {
      Storage.prototype[method] = () => {
        throw new Error("storage blocked");
      };
    }
  });
  const { page, errors } = await open(context, "/en/");
  await openPanel(page);
  await chooseContrast(page, "high");
  await page.waitForTimeout(300);
  expect((await state(page)).contrast === "high", "without storage, a choice did not apply to the page");
  expect(errors.length === 0, `errors without storage: ${errors.join("; ")}`);
  await context.close();
}

// The reader's system settings apply without JavaScript, and an explicit choice overrides them.
{
  let context = await browser.newContext({ javaScriptEnabled: false, colorScheme: "dark" });
  let { page } = await open(context, "/en/");
  expect((await background(page)) === DARK, "a dark system setting did not give dark colours");
  expect(!(await page.isVisible("[data-preferences]")), "the preferences part is shown without JavaScript");
  expect((await state(page)).fontSet === "hyperlegible", "the site's font set is not used without JavaScript");
  await context.close();

  context = await browser.newContext({ javaScriptEnabled: false, contrast: "more" });
  ({ page } = await open(context, "/en/"));
  expect((await background(page)) === WHITE, "a high contrast system setting did not give high contrast");
  await context.close();

  context = await browser.newContext({ colorScheme: "dark" });
  await context.addInitScript((key) => localStorage.setItem(key, JSON.stringify({ version: 1, contrast: "site" })), KEY);
  ({ page } = await open(context, "/en/"));
  expect((await background(page)) === WASHI, "choosing the site's colours did not override a dark system setting");
  await context.close();
}

// The Arabic panel is in Arabic and right to left.
{
  const context = await browser.newContext();
  const { page, errors } = await open(context, "/ar/");
  await openPanel(page);
  expect((await page.textContent(".flc-prefsEditor-text-font-label")).includes("الخطوط"), "the Arabic panel is not in Arabic");
  expect((await page.evaluate(() => getComputedStyle(document.querySelector(".fl-prefsEditor")).direction)) === "rtl", "the Arabic panel is not right to left");
  expect(errors.length === 0, `errors in the Arabic panel: ${errors.join("; ")}`);
  await context.close();
}

// English and French pages never download an Arabic font, even with Arabic language names
// in the switcher; Arabic pages use the Arabic companion.
{
  const context = await browser.newContext();
  for (const url of ["/en/", "/fr/", "/en/services/design/"]) {
    const { fonts } = await open(context, url);
    expect(!fonts().some((file) => file.includes("arabic")), `${url} downloaded an Arabic font: ${fonts().join(", ")}`);
  }
  const { page, fonts } = await open(context, "/ar/");
  expect(fonts().some((file) => file.startsWith("ibm-plex-sans-arabic-")), "/ar/ did not download IBM Plex Sans Arabic");
  expect((await page.evaluate(() => getComputedStyle(document.body).fontFamily)).includes("IBM Plex Sans Arabic"), "/ar/ body text does not use the Arabic companion");
  await context.close();
}

// Vertical rhythm: every heading, paragraph, list item, caption and table cell starts a
// whole number of baselines below the page title, in every font set, at phone and
// desktop widths, in Latin and Arabic text, and with larger text and line spacing.
// Images, cards and rules may sit off the grid themselves, but the text after them must
// return to it. The only allowance is 0.3px, for sub-pixel rounding.
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
const rhythmSettings = [
  { fontSet: "hyperlegible" },
  { fontSet: "mincho" },
  { fontSet: "gothic" },
  { fontSet: "hyperlegible", textSize: 1.4, lineSpace: 1.3 },
];
for (const settings of rhythmSettings) {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(([key, value]) => localStorage.setItem(key, JSON.stringify({ version: 1, ...value })), [KEY, settings]);
    for (const url of rhythmPages) {
      const { page } = await open(context, url);
      const off = await page.evaluate(() => {
        // The baseline in pixels, measured, since it depends on the reader's preferences.
        const probe = document.body.appendChild(document.createElement("div"));
        probe.style.blockSize = "var(--baseline)";
        const baseline = probe.getBoundingClientRect().height;
        probe.remove();
        const main = document.querySelector("main");
        const top = main.querySelector("h1").getBoundingClientRect().top;
        return [...main.querySelectorAll("h1, h2, h3, h4, p, li, figcaption, th, td")]
          .filter((element) => element.getClientRects().length)
          .map((element) => ({ element, px: element.getBoundingClientRect().top - top }))
          .filter(({ px }) => Math.abs(px - Math.round(px / baseline) * baseline) > 0.3)
          .map(({ element, px }) => `${element.localName} at ${(px / baseline).toFixed(2)}`);
      });
      expect(off.length === 0, `${JSON.stringify(settings)}, ${width}px, ${url}: off the baseline grid: ${off.slice(0, 4).join("; ")}`);
      await page.close();
    }
    await context.close();
  }
}

await browser.close();
server.close();

for (const problem of problems) console.log(problem);
console.log(`browser checks: ${problems.length} problems`);
process.exitCode = problems.length ? 1 : 0;
