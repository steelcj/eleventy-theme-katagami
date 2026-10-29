// Reader preferences: shows the preferences part, resets preferences, and loads Fluid
// Infusion UI Options the first time a reader opens the panel. Preferences are kept in
// localStorage under "katagami-preferences" as { version: 1, fontSet, contrast,
// textSize, lineSpace }, holding only values that differ from the defaults. Without
// JavaScript the part stays hidden and the site's and the system's settings apply.
(() => {
  const KEY = "katagami-preferences";
  const panel = document.querySelector("[data-preferences]");
  if (!panel) return;

  const root = document.documentElement;
  const stylesheet = document.getElementById("font-set");
  const defaults = { fontSet: panel.dataset.fontSet, contrast: "default", textSize: 1, lineSpace: 1 };

  // Shows one preference on the page; the head script does the same before the page is drawn.
  function apply(name, value) {
    if (name === "fontSet" && stylesheet && panel.dataset.fontSets.split(" ").includes(value)) {
      stylesheet.setAttribute("href", stylesheet.getAttribute("href").replace(/[a-z-]+\.css$/, `${value}.css`));
    } else if (name === "contrast") {
      // "default" follows the reader's device; any other choice overrides it.
      if (value === "default") root.removeAttribute("data-contrast");
      else root.setAttribute("data-contrast", value);
    } else if (name === "textSize" || name === "lineSpace") {
      const property = name === "textSize" ? "--text-size" : "--line-space";
      if (value === 1) root.style.removeProperty(property);
      else root.style.setProperty(property, value);
    }
  }

  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      return saved && saved.version === 1 ? saved : {};
    } catch {
      return {};
    }
  }

  // Saves only the values that differ from the defaults, and nothing at all when none do.
  function write(preferences) {
    const changed = Object.fromEntries(Object.entries(preferences).filter(([name, value]) => name in defaults && value !== defaults[name]));
    try {
      if (Object.keys(changed).length) localStorage.setItem(KEY, JSON.stringify({ version: 1, ...changed }));
      else localStorage.removeItem(KEY);
    } catch {
      // Without storage, preferences last for this page only.
    }
  }

  function reset() {
    write({});
    for (const [name, value] of Object.entries(defaults)) apply(name, value);
  }

  window.katagami = { ...window.katagami, preferences: { defaults, apply, read, write, reset, panel } };

  // Reset works before Infusion has loaded too; once it has, Infusion resets its own panel
  // as well, and the store clears the saved preferences.
  panel.querySelector("[data-preferences-reset]")?.addEventListener("click", reset);

  // The first time the panel is opened, Infusion and the theme's setup load, and the panel
  // then opens through Infusion, which handles the button from then on.
  const toggle = panel.querySelector(".flc-slidingPanel-toggleButton");
  const base = panel.dataset.infusion;
  const themeStylesheet = document.querySelector('link[href$="/theme.css"]');
  const load = (tag, attributes) =>
    new Promise((resolve, reject) => {
      const element = Object.assign(document.createElement(tag), attributes, { onload: resolve, onerror: reject });
      // Infusion's stylesheets go before the theme's, so the theme's rules win.
      if (tag === "link") document.head.insertBefore(element, themeStylesheet);
      else document.head.append(element);
    });
  // If Infusion cannot load, the button says so, a status message announces it, and the
  // rest of the page is untouched; clicking again tries once more.
  const label = toggle.textContent;
  const status = panel.querySelector("[data-preferences-status]");
  let started = false;
  toggle.addEventListener("click", async (event) => {
    if (started) return;
    started = true;
    event.stopImmediatePropagation();
    toggle.textContent = label;
    status.textContent = "";
    toggle.setAttribute("aria-busy", "true");
    try {
      await Promise.all(
        ["fluid.css", "PrefsEditor.css", "SeparatedPanelPrefsEditor.css"].map((file) => load("link", { rel: "stylesheet", href: `${base}css/${file}` })),
      );
      await load("script", { src: `${base}infusion-uio.js` });
      await load("script", { src: panel.dataset.setup });
      await window.katagami.preferences.create();
      toggle.click();
    } catch {
      started = false;
      toggle.textContent = panel.dataset.failed;
      status.textContent = panel.dataset.failed;
    } finally {
      toggle.removeAttribute("aria-busy");
    }
  });

  panel.hidden = false;
})();
