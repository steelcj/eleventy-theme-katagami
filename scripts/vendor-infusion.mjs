// Copies the parts of Fluid Infusion that the reader preferences panel needs into
// themes/katagami/assets/vendor/infusion/: the UI Options build, three stylesheets, the
// panel's icon font, the templates for the four panels, English and French messages for
// the text size and line spacing panels, and the licences of Infusion and of the
// libraries bundled into the build, jQuery and fastXmlPull. The version is pinned in
// theme.yaml under preferences.infusion; the package is fetched with npm pack into a
// temporary folder, so it never becomes a dependency. Usage: npm run vendor-infusion

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import yaml from "js-yaml";

const theme = "themes/katagami";
const target = path.join(theme, "assets/vendor/infusion");
const { infusion: version } = yaml.load(fs.readFileSync(`${theme}/theme.yaml`, "utf8")).preferences;

if (!/^\d+\.\d+\.\d+$/.test(String(version))) {
  throw new Error(`theme.yaml: preferences.infusion needs an exact version such as 4.8.0, not "${version}"`);
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), "katagami-infusion-"));
const tarball = execFileSync("npm", ["pack", `infusion@${version}`, "--silent", "--pack-destination", work], { encoding: "utf8" })
  .trim()
  .split("\n")
  .pop();
execFileSync("tar", ["-xzf", path.join(work, tarball), "-C", work]);
const pkg = path.join(work, "package");
const fetched = JSON.parse(fs.readFileSync(path.join(pkg, "package.json"), "utf8")).version;
if (fetched !== String(version)) throw new Error(`infusion: asked for ${version}, fetched ${fetched}`);

const preferences = "src/framework/preferences";
const panels = ["textSize", "lineSpace", "textFont", "contrast"];
const files = {
  "infusion-uio.js": "dist/infusion-uio.js",
  "licenses/Infusion-LICENSE.txt": "Infusion-LICENSE.txt",
  "licenses/AUTHORS.md": "AUTHORS.md",
  "licenses/jQuery-LICENSE.txt": "tests/lib/jQuery-LICENSE.txt",
  "licenses/fastXmlPull-LICENSE.txt": "src/lib/fastXmlPull/fastXmlPull-LICENSE.txt",
  "css/fluid.css": "src/framework/core/css/fluid.css",
  "css/PrefsEditor.css": `${preferences}/css/PrefsEditor.css`,
  "css/SeparatedPanelPrefsEditor.css": `${preferences}/css/SeparatedPanelPrefsEditor.css`,
  "fonts/PrefsFramework-Icons.woff": `${preferences}/fonts/PrefsFramework-Icons.woff`,
  "html/SeparatedPanelPrefsEditor.html": `${preferences}/html/SeparatedPanelPrefsEditor.html`,
};
for (const panel of panels) {
  files[`html/PrefsEditorTemplate-${panel}.html`] = `${preferences}/html/PrefsEditorTemplate-${panel}.html`;
}
// Messages for the panels whose wording the theme keeps; the theme supplies its own for
// the panel's button, the font set and contrast panels, and Arabic for all of them, in
// i18n/preferences/.
for (const name of ["textSize", "lineSpace"]) {
  for (const suffix of ["", "_en", "_fr"]) {
    files[`messages/${name}${suffix}.json`] = `${preferences}/messages/${name}${suffix}.json`;
  }
}

fs.rmSync(target, { recursive: true, force: true });
for (const [to, from] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(path.join(target, to)), { recursive: true });
  fs.copyFileSync(path.join(pkg, from), path.join(target, to));
}
fs.writeFileSync(
  path.join(target, "README.md"),
  `# Fluid Infusion ${version}

Copied from the \`infusion\` package by \`scripts/vendor-infusion.mjs\`, which reads the version from \`theme.yaml\`. Do not edit these files by hand; change the version and run \`npm run vendor-infusion\`. Infusion is dual-licensed under the Educational Community License 2.0 and the BSD 3-Clause licence. The UI Options build also bundles jQuery, under the MIT licence, and fastXmlPull. Their licences and Infusion's authors are in \`licenses/\`.
`,
);
fs.rmSync(work, { recursive: true, force: true });
console.log(`Vendored Infusion ${version}: ${Object.keys(files).length} files.`);
