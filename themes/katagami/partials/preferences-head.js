(function () {
  // Applies the reader's saved preferences before the page is drawn. Static, so that its
  // hash, written to assets/csp.json at build time, can go in a Content Security Policy.
  var root = document.documentElement;
  var saved = null;
  try {
    saved = JSON.parse(localStorage.getItem("katagami-preferences") || "null");
    // A font set chosen before version 1 moves into the new format once.
    var older = localStorage.getItem("katagami-font-set");
    if (older) {
      saved = saved || { version: 1, fontSet: older };
      localStorage.setItem("katagami-preferences", JSON.stringify(saved));
      localStorage.removeItem("katagami-font-set");
    }
  } catch (error) {
    saved = null;
  }
  if (!saved || saved.version !== 1) return;
  var link = document.getElementById("font-set");
  if (link && (" " + link.getAttribute("data-font-sets") + " ").indexOf(" " + saved.fontSet + " ") > -1) {
    link.setAttribute("href", link.getAttribute("href").replace(/[a-z-]+\.css$/, saved.fontSet + ".css"));
  }
  if (/^[a-z-]+$/.test(saved.contrast)) root.setAttribute("data-contrast", saved.contrast);
  if (saved.textSize > 0) root.style.setProperty("--text-size", saved.textSize);
  if (saved.lineSpace > 0) root.style.setProperty("--line-space", saved.lineSpace);
})();
