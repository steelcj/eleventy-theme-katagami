// Lets readers choose a font set. The choice is kept in localStorage and applied by a
// short script in the page head before the page is drawn; this file shows the control
// and switches the font set's stylesheet when the choice changes. Without JavaScript the
// control stays hidden and the site's default font set is used.
(() => {
  const control = document.querySelector("[data-ui-options]");
  const choice = document.querySelector("[data-font-set-choice]");
  const stylesheet = document.getElementById("font-set");
  if (!control || !choice || !stylesheet) return;

  const current = stylesheet.getAttribute("href").match(/\/([a-z-]+)\.css$/);
  if (current) choice.value = current[1];

  choice.addEventListener("change", () => {
    stylesheet.href = `/assets/css/fonts/${choice.value}.css`;
    try {
      localStorage.setItem("katagami-font-set", choice.value);
    } catch {
      // Without storage the choice lasts for this page only.
    }
  });
  control.hidden = false;
})();
