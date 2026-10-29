/* global fluid, jQuery */
// The theme's setup for Fluid Infusion UI Options, loaded after Infusion when a reader first
// opens the preferences panel. It offers four of Infusion's preferences, with the theme's
// choices: the theme's font sets, and contrast that follows the reader's device (the
// default), keeps the site's colours, or switches to high contrast or dark. Preferences are kept by a local
// storage store, in the theme's own format, and enacted on the theme's tokens: the text
// size on the root font size, line spacing on the baseline unit, the font set on its
// stylesheet, and contrast on the html element's data-contrast attribute.
(() => {
  "use strict";
  const preferences = window.katagami.preferences;
  const { panel } = preferences;
  const fontSets = panel.dataset.fontSets.split(" ");

  // Infusion's preferences and the theme's names for them.
  const names = {
    "fluid.prefs.textSize": "textSize",
    "fluid.prefs.lineSpace": "lineSpace",
    "fluid.prefs.textFont": "fontSet",
    "fluid.prefs.contrast": "contrast",
  };
  const nameOf = (key) => names[key.replace(/_/g, ".")];
  const keyOf = (name) => Object.keys(names).find((key) => names[key] === name).replace(/\./g, "_");

  // The store: Infusion reads and writes { preferences: { fluid_prefs_textSize: 1.2, … } };
  // the theme keeps { version: 1, textSize: 1.2, … } with only non-default values.
  fluid.defaults("katagami.prefs.localStore", {
    gradeNames: ["fluid.dataSource"],
    writableGrade: "katagami.prefs.localStore.writable",
    listeners: {
      "onRead.impl": { listener: "katagami.prefs.localStore.read" },
    },
    invokers: {
      get: { args: ["{that}", "{arguments}.0"] },
    },
  });
  fluid.defaults("katagami.prefs.localStore.writable", {
    gradeNames: ["fluid.dataSource.writable"],
    listeners: {
      "onWrite.impl": { listener: "katagami.prefs.localStore.write" },
    },
    invokers: {
      set: { args: ["{that}", "{arguments}.0", "{arguments}.1"] },
    },
  });
  fluid.registerNamespace("katagami.prefs.localStore");
  katagami.prefs.localStore.read = function () {
    const saved = preferences.read();
    const model = {};
    for (const [name, value] of Object.entries(saved)) {
      if (name !== "version") model[keyOf(name)] = value;
    }
    return JSON.stringify({ preferences: model });
  };
  katagami.prefs.localStore.write = function (payload) {
    const model = (typeof payload === "string" ? JSON.parse(payload) : payload)?.preferences ?? {};
    const saved = {};
    for (const [key, value] of Object.entries(model)) {
      const name = nameOf(key);
      if (name) saved[name] = value;
    }
    preferences.write(saved);
    return payload;
  };

  // Enactors: one per preference, each showing its value on the page.
  fluid.defaults("katagami.prefs.enactor", {
    gradeNames: ["fluid.prefs.enactor"],
    applyInitValue: true,
    modelListeners: {
      value: {
        listener: "katagami.prefs.enactor.apply",
        args: ["{that}.options.preferenceName", "{change}.value"],
      },
    },
  });
  fluid.registerNamespace("katagami.prefs.enactor");
  katagami.prefs.enactor.apply = (name, value) => preferences.apply(name, value);
  for (const [key, name] of Object.entries(names)) {
    fluid.defaults(`katagami.prefs.enactor.${name}`, {
      gradeNames: ["katagami.prefs.enactor"],
      preferenceName: name,
      preferenceMap: { [key]: { "model.value": "value" } },
    });
  }

  // The panel's button is a disclosure: its visible label stays the same and aria-expanded
  // tells whether the panel is open. Infusion also sets aria-pressed, a role and a changing
  // aria-label on it, which are removed after each change.
  fluid.registerNamespace("katagami.prefs");
  katagami.prefs.disclosure = (that) => {
    that.locate("toggleButton").removeAttr("aria-pressed").removeAttr("aria-label").removeAttr("role");
  };

  // Creates UI Options in the preferences part, and resolves once its sliding panel, which
  // handles the toggle button, exists. The editor itself loads lazily, when the panel first
  // opens, so this does not wait for it.
  preferences.create = () =>
    new Promise((resolve) => {
      // Infusion animates the panel with jQuery; readers who ask for less motion get none.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) jQuery.fx.off = true;
      const contrasts = ["default", "site", "high", "dark"];

      // The theme's choices replace Infusion's starter schemas for fonts and contrast.
      // Re-registering the grades replaces them outright; supplying a primary schema
      // instead would merge the lists of choices item by item.
      fluid.defaults("fluid.prefs.schemas.textFont", {
        gradeNames: ["fluid.prefs.schemas"],
        schema: {
          "fluid.prefs.textFont": {
            type: "string",
            default: preferences.defaults.fontSet,
            enum: fontSets,
            enumLabels: fontSets.map((set) => `fontSet-${set}`),
          },
        },
      });
      fluid.defaults("fluid.prefs.schemas.contrast", {
        gradeNames: ["fluid.prefs.schemas"],
        schema: {
          "fluid.prefs.contrast": {
            type: "string",
            default: "default",
            enum: contrasts,
            enumLabels: contrasts.map((contrast) => `contrast-${contrast}`),
          },
        },
      });

      fluid.uiOptions.multilingual(panel, {
        preferences: Object.keys(names),
        // The language only: the panel's messages are per language, not per region.
        locale: panel.dataset.locale.split("-")[0],
        direction: panel.dataset.direction,
        storeType: "katagami.prefs.localStore",
        auxiliarySchema: {
          terms: {
            templatePrefix: `${panel.dataset.infusion}html`,
            messagePrefix: `${panel.dataset.infusion}messages`,
          },
          "fluid.prefs.textSize": { enactor: { type: "katagami.prefs.enactor.textSize" } },
          "fluid.prefs.lineSpace": { enactor: { type: "katagami.prefs.enactor.lineSpace" } },
          "fluid.prefs.textFont": {
            enactor: { type: "katagami.prefs.enactor.fontSet" },
            panel: {
              message: "%messagePrefix/fontSet.json",
              classnameMap: { textFont: Object.fromEntries(fontSets.map((set) => [set, `katagami-preview-font-${set}`])) },
            },
          },
          "fluid.prefs.contrast": {
            enactor: { type: "katagami.prefs.enactor.contrast" },
            panel: {
              classnameMap: { theme: Object.fromEntries(contrasts.map((contrast) => [contrast, `katagami-preview-contrast-${contrast}`])) },
            },
          },
        },
        prefsEditorLoader: {
          lazyLoad: true,
          slidingPanel: {
            listeners: {
              "onCreate.katagamiReady": { listener: () => resolve(), priority: "last" },
              "onPanelShow.katagamiDisclosure": { listener: "katagami.prefs.disclosure", args: ["{that}"], priority: "last" },
              "onPanelHide.katagamiDisclosure": { listener: "katagami.prefs.disclosure", args: ["{that}"], priority: "last" },
            },
            modelListeners: {
              "isShowing.katagamiDisclosure": { listener: "katagami.prefs.disclosure", args: ["{that}"], priority: "last" },
            },
          },
        },
      });
    });
})();
