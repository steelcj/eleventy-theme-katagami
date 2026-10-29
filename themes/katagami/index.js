// Katagami theme plugin: registers the template loader, layout stubs, Markdown,
// data, filters, linters and asset copies. The site's eleventy.config.js sets
// the directories, which plugins cannot do, and then adds this plugin.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Nunjucks from "nunjucks";
import markdownIt from "markdown-it";
import yaml from "js-yaml";
import matter from "gray-matter";
import EleventyNavigation from "@11ty/eleventy-navigation";
import typography from "./typography.js";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import sharp from "sharp";

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

// The proportions of the images in src/media/, read before each build, such as
// "/media/seigaiha.jpg" → "3x2". An image in the text flow gets a ratio class, and the
// CSS rounds its height up to a whole baseline, so the text after it stays on the grid.
const imageRatios = new Map();
const RASTER = /\.(jpe?g|png|webp|avif|tiff?)$/i;

function ratioName(width, height) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const divisor = gcd(width, height);
  return `${width / divisor}x${height / divisor}`;
}

function imageRatioClass(src) {
  const ratio = imageRatios.get(src);
  return ratio ? `ratio-${ratio}` : "";
}

function createMarkdown() {
  const md = markdownIt({ html: false, linkify: false, typographer: true }).use(typography);

  // Images in Markdown get their ratio class too.
  const renderImage = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const ratio = imageRatioClass(tokens[idx].attrGet("src"));
    if (ratio) tokens[idx].attrJoin("class", ratio);
    return renderImage(tokens, idx, options, env, self);
  };

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

  // Table column alignment becomes a data-align attribute instead of an inline
  // text-align style, so it follows the page direction: a column aligned left in
  // Markdown is aligned to the start of the line, which is the right in Arabic.
  const logicalAlign = { left: "start", center: "center", right: "end" };
  md.core.ruler.push("logical_table_align", (state) => {
    for (const token of state.tokens) {
      if (token.type !== "th_open" && token.type !== "td_open") continue;
      const align = token.attrGet("style")?.match(/text-align:(left|center|right)/)?.[1];
      if (!align) continue;
      token.attrs = token.attrs.filter(([name]) => name !== "style");
      token.attrSet("data-align", logicalAlign[align]);
    }
  });

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
  const { content, data, matter: frontMatter } = matter(fileContent);
  // Report lines relative to the file, not to the body after front matter.
  const offset = frontMatter ? fileContent.slice(0, fileContent.indexOf(content)).split("\n").length - 1 : 0;
  for (const { line, html } of findRawHtml(content)) {
    console.warn(`[katagami] Raw HTML is escaped in ${inputPath}:${line + offset}: ${html}`);
  }
  // Text fields of blocks, such as a text block's body, are Markdown too.
  const visit = (value, where) => {
    if (typeof value === "string") {
      for (const { html } of findRawHtml(value)) console.warn(`[katagami] Raw HTML is escaped in ${inputPath}, ${where}: ${html}`);
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => visit(item, `${where}[${i}]`));
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) visit(item, `${where}.${key}`);
    }
  };
  visit(data.blocks, "blocks");
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

// Files already reported in this build.
const jsDataWarnings = new Set();

// A directory or template data file in YAML or JSON, such as services/services.11tydata.yaml.
function readDataFile(dir, name) {
  // regionOverrides in a JavaScript data file would reach the page only through Eleventy's
  // merged data, which the theme does not use for regions, so it is reported instead.
  for (const ext of ["js", "mjs", "cjs"]) {
    const file = path.join(dir, `${name}.11tydata.${ext}`);
    if (!jsDataWarnings.has(file) && fs.existsSync(file) && fs.readFileSync(file, "utf8").includes("regionOverrides")) {
      jsDataWarnings.add(file);
      console.warn(`[katagami] ${file} sets regionOverrides, which the theme reads only from YAML or JSON data files and front matter. Move it to ${name}.11tydata.yaml.`);
    }
  }
  for (const ext of ["yaml", "yml", "json"]) {
    const file = path.join(dir, `${name}.11tydata.${ext}`);
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, "utf8");
      return ext === "json" ? JSON.parse(text) : yaml.load(text);
    }
  }
  return undefined;
}

// The font sets from theme.yaml, with the one font file each preloads: the body font's
// regular weight, or on pages in a locale with `fontSet: arabic`, the Arabic companion's.
function fontSetState({ fontSets, fonts }) {
  const regular = (name, subset) => `/assets/fonts/${name}/${name}-${subset}-400-normal.woff2`;
  const preload = {};
  for (const [set, { body, arabic }] of Object.entries(fontSets.sets)) {
    preload[set] = { latin: regular(body, fonts[body].subsets[0]), arabic: regular(arabic, "arabic") };
  }
  return { default: fontSets.default, names: Object.keys(fontSets.sets), preload };
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

export default async function katagami(eleventyConfig) {
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
    // Site text is rendered with its language's tag, for quotation marks and spacing.
    const locales = readYaml(path.join(eleventyConfig.directories?.data ?? path.join(inputDir, "_data"), "locales.yaml"));
    const tagFor = (code) => (Array.isArray(locales) ? locales.find((locale) => locale.code === code)?.tag : undefined) ?? code;
    const siteText = {};
    for (const lang of fs.readdirSync(inputDir)) {
      const dir = path.join(inputDir, lang, "_site");
      if (!fs.existsSync(dir)) continue;
      siteText[lang] = {};
      for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith(".md")) continue;
        const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
        siteText[lang][path.basename(file, ".md")] = { data, html: md.render(content, { langTag: tagFor(lang) }) };
      }
    }
    state = {
      name: manifest.title,
      version: manifest.version,
      defaults: { regions: readYaml(`${THEME_DIR}/defaults/regions.yaml`) },
      images: manifest.images,
      fontSets: fontSetState(manifest),
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
  eleventyConfig.on("eleventy.before", () => {
    layerCache.clear();
    jsDataWarnings.clear();
  });
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
  // A stub for each layout the theme ships, and for each layout only the site has.
  const layoutFiles = new Set(fs.readdirSync(`${THEME_DIR}/layouts`));
  if (fs.existsSync(`${SITE_DIR}/layouts`)) {
    for (const file of fs.readdirSync(`${SITE_DIR}/layouts`)) layoutFiles.add(file);
  }
  for (const file of layoutFiles) {
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
    // The page's language tag, such as fr-CA: its locale's `tag`, or its code. Folders and
    // URLs use the code; the html lang attribute, dates and typography use the tag.
    langTag: (data) => data.locales?.find((locale) => locale.code === data.lang)?.tag ?? data.lang,
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

  // Blocks and views. A name is a contract between content and the theme: an unknown
  // block type or view warns and renders a placeholder in development, and fails a
  // production build so that a broken page is never published.
  function partialFor(kind, label, name, inputPath) {
    const known =
      typeof name === "string" &&
      /^[a-z][a-z0-9-]*$/.test(name) &&
      [SITE_DIR, THEME_DIR].some((dir) => fs.existsSync(path.join(dir, kind, `${name}.njk`)));
    if (known) return `${kind}/${name}.njk`;
    const message = `[katagami] Unknown ${label} "${name}" in ${inputPath}`;
    if (state.production) {
      // Eleventy's error report drops a filter's message, so it is printed first.
      console.error(message);
      throw new Error(message);
    }
    console.warn(message);
    return undefined;
  }
  eleventyConfig.addFilter("blockPartial", (type, inputPath) => partialFor("blocks", "block type", type, inputPath));
  eleventyConfig.addFilter("viewPartial", (view, inputPath) => partialFor("views", "view", view, inputPath));
  eleventyConfig.addFilter("markdown", (text, langTag) => md.render(String(text ?? ""), { langTag }));
  // Plain-text fields, such as titles and descriptions: the same smart punctuation and
  // spacing as Markdown, but no Markdown syntax, so *a* stays *a*. Escaped for HTML.
  const plain = markdownIt({ html: false, linkify: false, typographer: true })
    .disable(["newline", "escape", "backticks", "strikethrough", "emphasis", "link", "image", "autolink", "entity"])
    .use(typography);
  eleventyConfig.addFilter("typeset", (text, langTag) => plain.renderInline(String(text ?? ""), { langTag }));
  eleventyConfig.addFilter("pageByUrl", (pages, url, inputPath) => {
    const found = pages.find((item) => item.url === url);
    if (!found && inputPath) console.warn(`[katagami] ${url} matches no page, linked from ${inputPath}`);
    return found;
  });
  // The pages directly inside a folder, given by its URL, sorted by order, title, date
  // (newest first) or date-asc (soonest first, for upcoming events). Pages hidden from
  // navigation are included, as in Plone listings.
  const sorters = {
    order: (a, b) =>
      (a.data.order ?? Infinity) - (b.data.order ?? Infinity) || sorters.title(a, b),
    title: (a, b) => String(a.data.title).localeCompare(String(b.data.title), a.data.lang),
    date: (a, b) => b.date - a.date,
    "date-asc": (a, b) => a.date - b.date,
  };
  eleventyConfig.addFilter("folderItems", (pages, folderUrl, sort = "order", limit = undefined, inputPath = undefined) => {
    const key = pages.find((item) => item.url === folderUrl)?.data.eleventyNavigation?.key;
    if (!key) {
      if (inputPath) console.warn(`[katagami] ${folderUrl} matches no folder, listed in ${inputPath}`);
      return [];
    }
    const items = pages
      .filter((item) => item.data.eleventyNavigation?.parent === key)
      .sort(sorters[sort] ?? sorters.order);
    return limit ? items.slice(0, limit) : items;
  });
  eleventyConfig.addFilter("formatDate", (date, lang) =>
    new Intl.DateTimeFormat(lang, { dateStyle: "long", timeZone: "UTC" }).format(new Date(date)),
  );
  eleventyConfig.addFilter("hasDates", (items) => items.some((item) => item.data.date));
  eleventyConfig.addFilter("isoDate", (date) => new Date(date).toISOString().slice(0, 10));

  // Theme pages. The language chooser at / is skipped when the site has its own home page.
  if (!fs.readdirSync(inputDir).some((file) => file.startsWith("index."))) {
    eleventyConfig.addTemplate("katagami-languages.njk", '{% extends "templates/languages.njk" %}', {
      permalink: "/index.html",
      eleventyExcludeFromCollections: true,
      layout: false,
    });
  }

  // Images: every <img> on a page, from templates or Markdown, becomes a <picture> with
  // the widths and formats in theme.yaml. Processed files are kept in .cache/ so a clean
  // build does not encode them again, and only the files pages use are published.
  const imageCache = ".cache/katagami/img";
  const imageUrl = "/media/img/";
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: state.images.formats,
    widths: state.images.widths,
    outputDir: imageCache,
    urlPath: imageUrl,
    failOnError: state.production,
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async", sizes: state.images.sizes.content },
    },
  });
  eleventyConfig.on("eleventy.after", ({ results, directories }) => {
    const used = new Set();
    for (const { content } of results) {
      for (const [file] of String(content).matchAll(/(?<=\/media\/img\/)[\w.-]+/g)) used.add(file);
    }
    const target = path.join(directories.output, imageUrl);
    for (const file of used) {
      if (fs.existsSync(path.join(imageCache, file))) {
        fs.mkdirSync(target, { recursive: true });
        fs.copyFileSync(path.join(imageCache, file), path.join(target, file));
      }
    }
  });
  // The <img> for an image field, `{ src, alt, decorative }`: alt text is required unless
  // the image is marked decorative.
  eleventyConfig.addFilter("imageAlt", (image, inputPath) => {
    if (image?.decorative) return "";
    if (image?.alt) return image.alt;
    const message = `[katagami] Image ${image?.src} has no alt text and is not marked decorative, in ${inputPath}`;
    if (state.production) {
      console.error(message);
      throw new Error(message);
    }
    console.warn(message);
    return "";
  });
  // The image's own path, after warning when a site image is missing. A production build
  // fails on it in the image plugin.
  eleventyConfig.addFilter("imageSrc", (src, inputPath) => {
    if (typeof src === "string" && src.startsWith("/") && !fs.existsSync(path.join(inputDir, src))) {
      console.warn(`[katagami] Image ${src} is not in ${inputDir}, used in ${inputPath}`);
    }
    return src;
  });
  eleventyConfig.addFilter("firstImageBlock", (blocks) => (blocks ?? []).findIndex((block) => block?.type === "image"));

  // Image proportions: read from src/media/ before each build, and written after it as
  // assets/css/image-ratios.css, one custom property per ratio class.
  eleventyConfig.on("eleventy.before", async () => {
    imageRatios.clear();
    const media = path.join(inputDir, "media");
    if (!fs.existsSync(media)) return;
    for (const file of fs.readdirSync(media, { recursive: true })) {
      if (!RASTER.test(file)) continue;
      const metadata = await sharp(path.join(media, file)).metadata();
      const { width, height } = metadata.autoOrient ?? metadata;
      if (width && height) imageRatios.set(`/media/${file.split(path.sep).join("/")}`, ratioName(width, height));
    }
  });
  eleventyConfig.on("eleventy.after", ({ directories }) => {
    const rules = [...new Set(imageRatios.values())].sort().map((ratio) => {
      const [width, height] = ratio.split("x").map(Number);
      return `.ratio-${ratio} {\n  --image-ratio: ${(height / width).toFixed(6)};\n}`;
    });
    const target = path.join(directories.output, "assets/css");
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, "image-ratios.css"), `/* Generated by the theme from the images in src/media/. */\n\n${rules.join("\n\n")}\n`);
  });
  eleventyConfig.addFilter("imageRatio", imageRatioClass);

  // Assets and passthrough folders. Raster images in media/ are published only as
  // processed files.
  eleventyConfig.addPassthroughCopy({ [`${THEME_DIR}/assets`]: "assets" }, { filter: ["**/*", "!**/README.md"] });
  eleventyConfig.addPassthroughCopy(`${inputDir}/admin`);
  eleventyConfig.addPassthroughCopy(`${inputDir}/media`, {
    filter: ["**/*", "!**/*.{jpg,jpeg,png,webp,avif,tif,tiff}"],
  });

  // site/index.js, when present, extends the theme as site/ files shadow it, so that
  // site-only build code stays out of eleventy.config.js.
  const sitePlugin = path.resolve(SITE_DIR, "index.js");
  if (fs.existsSync(sitePlugin)) {
    const { default: plugin } = await import(pathToFileURL(sitePlugin).href);
    await eleventyConfig.addPlugin(plugin);
  }
}
