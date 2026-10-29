// Katagami theme plugin: registers the template loader, layout stubs, Markdown,
// data, filters, linters and asset copies. The site's eleventy.config.js sets
// the directories, which plugins cannot do, and then adds this plugin.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Nunjucks from "nunjucks";
import markdownIt from "markdown-it";
import yaml from "js-yaml";
import matter from "gray-matter";
import EleventyNavigation from "@11ty/eleventy-navigation";

// Loader paths are relative to the repository root, the folder Eleventy runs from.
const THEME_DIR = path
  .relative(process.cwd(), path.dirname(fileURLToPath(import.meta.url)))
  .split(path.sep)
  .join("/");
const SITE_DIR = "site";

// Settings Eleventy only accepts as returned or exported configuration.
// The site's eleventy.config.js re-exports this object.
export const config = {
  // Template syntax in an editor's Markdown is never executed.
  markdownTemplateEngine: false,
};

function readYaml(file) {
  return fs.existsSync(file) ? yaml.load(fs.readFileSync(file, "utf8")) ?? {} : {};
}

function createMarkdown() {
  const md = markdownIt({ html: false, linkify: false, typographer: true });

  // Code is always left-to-right, whatever the page direction.
  for (const rule of ["fence", "code_block"]) {
    const render = md.renderer.rules[rule];
    md.renderer.rules[rule] = (...args) => render(...args).replace(/^<pre/, '<pre dir="ltr"');
  }
  const renderInlineCode = md.renderer.rules.code_inline;
  md.renderer.rules.code_inline = (...args) =>
    renderInlineCode(...args).replace(/^<code/, '<code dir="ltr"');

  // A URL shown as its own link text reads left-to-right, also inside right-to-left text.
  const renderLinkOpen =
    md.renderer.rules.link_open ?? ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    if (tokens[idx].markup === "autolink" || tokens[idx].markup === "linkify") {
      tokens[idx].attrSet("dir", "ltr");
    }
    return renderLinkOpen(tokens, idx, options, env, self);
  };

  return md;
}

// A parser that keeps raw HTML as tokens, used only to find it.
const htmlFinder = markdownIt({ html: true });

function findRawHtml(source) {
  const found = [];
  for (const token of htmlFinder.parse(source, {})) {
    if (token.type === "html_block") {
      found.push({ line: token.map[0] + 1, html: token.content.trim().split("\n")[0] });
    } else if (token.type === "inline") {
      for (const child of token.children) {
        if (child.type === "html_inline") {
          found.push({ line: token.map[0] + 1, html: child.content });
        }
      }
    }
  }
  return found;
}

function warnRawHtml(inputPath, fileContent) {
  const { content, matter: frontMatter } = matter(fileContent);
  // Report lines relative to the file, not to the body after front matter.
  const offset = frontMatter ? fileContent.slice(0, fileContent.indexOf(content)).split("\n").length - 1 : 0;
  for (const { line, html } of findRawHtml(content)) {
    console.warn(`[katagami] Raw HTML is escaped in ${inputPath}:${line + offset}: ${html}`);
  }
}

// A page's navigation key is its path inside the input folder: en/services/design
// for en/services/design.md, and en/services for en/services/index.md.
function navKey(inputDir, inputPath) {
  return path
    .relative(inputDir, inputPath)
    .split(path.sep)
    .join("/")
    .replace(/\.[^/.]+$/, "")
    .replace(/(^|\/)index$/, "");
}

function navParent(inputDir, key) {
  const segments = key.split("/");
  for (let depth = segments.length - 1; depth > 0; depth--) {
    const folder = segments.slice(0, depth).join("/");
    if (fs.existsSync(path.join(inputDir, folder, "index.md"))) return folder;
  }
  return undefined;
}

// A directory or template data file in YAML or JSON, such as services/services.11tydata.yaml.
function readDataFile(dir, name) {
  for (const ext of ["yaml", "yml", "json"]) {
    const file = path.join(dir, `${name}.11tydata.${ext}`);
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, "utf8");
      return ext === "json" ? JSON.parse(text) : yaml.load(text);
    }
  }
  return undefined;
}

function applyRegionOverride(parts, value) {
  if (value === undefined) return parts;
  if (value === "none" || value === false || value === null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return [...new Set([...parts, ...value])];
  return parts;
}

// Translations share a key: front matter `translationKey`, or by default the
// URL without its language prefix, so /en/services/ and /fr/services/ match.
function translationKey(url, lang, explicitKey) {
  if (explicitKey) return explicitKey;
  return url && lang && url.startsWith(`/${lang}/`) ? url.slice(lang.length + 1) : undefined;
}

export default function katagami(eleventyConfig) {
  const inputDir = eleventyConfig.directories?.input ?? "src";
  const md = createMarkdown();

  // Theme files and per-language site text, read at the start of every build
  // so that edits are picked up in watch mode.
  let state;
  function loadState() {
    const manifest = readYaml(`${THEME_DIR}/theme.yaml`);
    const strings = {};
    for (const file of fs.readdirSync(`${THEME_DIR}/i18n`)) {
      if (file.endsWith(".yaml")) strings[path.basename(file, ".yaml")] = readYaml(`${THEME_DIR}/i18n/${file}`);
    }
    const siteText = {};
    for (const lang of fs.readdirSync(inputDir)) {
      const dir = path.join(inputDir, lang, "_site");
      if (!fs.existsSync(dir)) continue;
      siteText[lang] = {};
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".md")) continue;
        const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
        siteText[lang][path.basename(file, ".md")] = { data, html: md.render(content) };
      }
    }
    state = {
      name: manifest.title,
      version: manifest.version,
      defaults: { regions: readYaml(`${THEME_DIR}/defaults/regions.yaml`) },
      strings,
      siteText,
      // Fixture locales are left out of the language switcher in production builds.
      production: process.env.ELEVENTY_ENV === "production",
    };
    return state;
  }
  eleventyConfig.on("eleventy.before", loadState);
  loadState();

  // Eleventy merges folder and page data before templates see it, and combines lists
  // on the way, so regionOverrides are read layer by layer from the files instead.
  const layerCache = new Map();
  eleventyConfig.on("eleventy.before", () => layerCache.clear());
  function regionOverrideLayers(inputPath) {
    if (!inputPath || !fs.existsSync(inputPath)) return [];
    if (layerCache.has(inputPath)) return layerCache.get(inputPath);
    const layers = [];
    const folders = path.relative(inputDir, path.dirname(inputPath)).split(path.sep).filter(Boolean);
    for (let depth = 0; depth <= folders.length; depth++) {
      const dir = path.join(inputDir, ...folders.slice(0, depth));
      layers.push(readDataFile(dir, path.basename(dir))?.regionOverrides);
    }
    const stem = path.basename(inputPath, path.extname(inputPath));
    layers.push(readDataFile(path.dirname(inputPath), stem)?.regionOverrides);
    layers.push(matter(fs.readFileSync(inputPath, "utf8")).data.regionOverrides);
    const found = layers.filter(Boolean);
    layerCache.set(inputPath, found);
    return found;
  }

  // Folders without an index.md: their pages would attach silently to the folder above.
  eleventyConfig.on("eleventy.before", () => {
    const dataDir = eleventyConfig.directories?.data ?? path.join(inputDir, "_data");
    const locales = readYaml(path.join(dataDir, "locales.yaml"));
    const codes = Array.isArray(locales) ? locales.map((locale) => locale.code) : [];
    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => !/^[_.]/.test(entry.name));
      const pages = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md"));
      if (pages.length && !pages.some((entry) => entry.name === "index.md")) {
        console.warn(`[katagami] ${dir} has pages but no index.md, so they attach to the folder above it.`);
      }
      for (const entry of entries) if (entry.isDirectory()) walk(path.join(dir, entry.name));
    };
    for (const code of codes) {
      if (fs.existsSync(path.join(inputDir, code))) walk(path.join(inputDir, code));
    }
  });

  // Templates: site/ shadows themes/katagami/, with caching off for watch mode.
  eleventyConfig.setLibrary(
    "njk",
    new Nunjucks.Environment(new Nunjucks.FileSystemLoader([SITE_DIR, THEME_DIR], { noCache: true })),
  );
  for (const file of fs.readdirSync(`${THEME_DIR}/layouts`)) {
    if (file.endsWith(".njk")) {
      eleventyConfig.addTemplate(`_layouts/${file}`, `{% extends "layouts/${file}" %}`);
    }
  }

  // Markdown: raw HTML escaped, URLs and code kept left-to-right.
  eleventyConfig.setLibrary("md", md);
  // Linters also run on site text, which is rendered although never written.
  eleventyConfig.addLinter("katagami-raw-html", function () {
    const inputPath = this.page?.inputPath;
    if (inputPath?.endsWith(".md") && fs.existsSync(inputPath)) {
      warnRawHtml(inputPath, fs.readFileSync(inputPath, "utf8"));
    }
  });

  // Data.
  eleventyConfig.addDataExtension("yaml,yml", (contents) => yaml.load(contents));
  eleventyConfig.addGlobalData("katagami", () => state);
  eleventyConfig.addGlobalData("eleventyComputed", {
    // Text direction follows the page language, as listed in _data/locales.yaml.
    dir: (data) => data.locales?.find((locale) => locale.code === data.lang)?.dir ?? "ltr",
    // Every page in a language folder joins the navigation tree. Its parent is the
    // nearest folder above it with an index.md; the language's home page is the root.
    eleventyNavigation: (data) => {
      if (!data.lang || data.permalink === false || data.eleventyExcludeFromCollections === true) return false;
      const key = navKey(inputDir, data.page.inputPath);
      if (key.split("/")[0] !== data.lang) return false;
      return {
        key,
        parent: navParent(inputDir, key),
        title: data.menuTitle ?? data.title,
        order: data.order,
        hidden: data.excludeFromNav === true,
      };
    },
  });
  eleventyConfig.addPlugin(EleventyNavigation);

  // Filters.
  eleventyConfig.addFilter("t", (key, lang) => {
    const text = state.strings[lang]?.[key] ?? state.strings.en?.[key];
    if (text === undefined) throw new Error(`[katagami] Missing interface string "${key}" in i18n/en.yaml`);
    return text;
  });
  eleventyConfig.addFilter("localeFor", (locales, code) => locales.find((locale) => locale.code === code) ?? locales[0]);
  // The parts in a region, inherited as Plone portlets are: the site's _data/regions.yaml
  // (or the theme default), then regionOverrides from each folder's directory data,
  // top-down, then from the page. A list adds parts, a part name replaces the region,
  // and `none` empties it.
  eleventyConfig.addFilter("regionParts", (regions, name, inputPath) => {
    let parts = Array.isArray(regions?.[name]) ? regions[name] : (state.defaults.regions[name] ?? []);
    for (const overrides of regionOverrideLayers(inputPath)) {
      parts = applyRegionOverride(parts, overrides?.[name]);
    }
    return parts;
  });
  // The URL of a page's translation into another language, or that language's home page.
  const translationIndexes = new WeakMap();
  eleventyConfig.addFilter("translationUrl", (pages, targetLang, url, lang, explicitKey) => {
    if (!translationIndexes.has(pages)) {
      const index = new Map();
      for (const item of pages) {
        const key = translationKey(item.url, item.data.lang, item.data.translationKey);
        if (key) index.set(`${item.data.lang} ${key}`, item.url);
      }
      translationIndexes.set(pages, index);
    }
    const key = translationKey(url, lang, explicitKey);
    return translationIndexes.get(pages).get(`${targetLang} ${key}`) ?? `/${targetLang}/`;
  });

  // Theme pages. The language chooser at / is skipped when the site has its own home page.
  if (!fs.readdirSync(inputDir).some((file) => file.startsWith("index."))) {
    eleventyConfig.addTemplate("katagami-languages.njk", '{% extends "templates/languages.njk" %}', {
      permalink: "/index.html",
      eleventyExcludeFromCollections: true,
      layout: false,
    });
  }

  // Assets and passthrough folders.
  eleventyConfig.addPassthroughCopy({ [`${THEME_DIR}/assets`]: "assets" });
  eleventyConfig.addPassthroughCopy(`${inputDir}/admin`);
  eleventyConfig.addPassthroughCopy(`${inputDir}/media`);
}
