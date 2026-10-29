import katagami from "./themes/katagami/index.js";

// Settings the theme needs that Eleventy only accepts as exported configuration.
export { config } from "./themes/katagami/index.js";

export default function (eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setIncludesDirectory("_includes"); // empty, inside src/
  eleventyConfig.setLayoutsDirectory("_layouts"); // virtual only, no folder on disk
  eleventyConfig.setDataDirectory("_data");
  eleventyConfig.setOutputDirectory("_site");
  eleventyConfig.addWatchTarget("site/");
  eleventyConfig.addWatchTarget("themes/katagami/");
  eleventyConfig.addPlugin(katagami);
}
