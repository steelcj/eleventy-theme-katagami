// Site extensions, added by the theme plugin after the theme itself.

import specimens from "./specimens/plugin.js";

export default function site(eleventyConfig) {
  // Temporary: font specimens for choosing the font sets in phase 4.
  eleventyConfig.addPlugin(specimens);
}
