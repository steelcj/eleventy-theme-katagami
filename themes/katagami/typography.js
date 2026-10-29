// Locale-aware typography for Markdown, as a markdown-it plugin. Eleventy passes the page's
// data as the render environment, so the page's `langTag` (its locale's `tag` in
// _data/locales.yaml, such as fr-CA) chooses the quotation marks and the French spacing.

const NBSP = " "; // non-breaking space
const NNBSP = " "; // narrow non-breaking space
const SPACES = "[ \\u00A0\\u202F]";

// Double, then single, quotation marks per language, used by markdown-it's smart quotes.
const QUOTES = {
  en: ["“", "”", "‘", "’"],
  fr: [`«${NBSP}`, `${NBSP}»`, "“", "”"],
  ar: ["«", "»", "‹", "›"],
};

// Quebec conventions for fr-CA; France's for fr, fr-FR and any other French locale.
export function frenchConventions(tag) {
  if (!/^fr(-|$)/i.test(tag ?? "")) return undefined;
  return /^fr-CA$/i.test(tag) ? "quebec" : "france";
}

// Spaces around punctuation in French text. Both conventions put a non-breaking space
// inside « » and before a colon used as punctuation (not in 12:45 or a URL). France puts a
// narrow non-breaking space before ; ! ?, and Quebec no space at all.
export function frenchSpacing(text, conventions) {
  const before = new RegExp(`${SPACES}*([;!?]+)(?=\\s|$|[»)\\]])`, "g");
  return text
    .replace(new RegExp(`«${SPACES}*`, "g"), `«${NBSP}`)
    .replace(new RegExp(`${SPACES}*»`, "g"), `${NBSP}»`)
    .replace(new RegExp(`${SPACES}*:(?=\\s|$)`, "g"), `${NBSP}:`)
    .replace(before, conventions === "quebec" ? "$1" : `${NNBSP}$1`);
}

function tagOf(env) {
  return String(env?.langTag ?? env?.lang ?? "en");
}

export default function typography(md) {
  // markdown-it renders synchronously, so setting the quotes for this render is safe.
  md.core.ruler.before("smartquotes", "katagami_quotes", (state) => {
    state.md.options.quotes = QUOTES[tagOf(state.env).split("-")[0].toLowerCase()] ?? QUOTES.en;
  });

  // French spacing on text, never on code, which is a separate token, or on a URL shown
  // as its own link text.
  md.core.ruler.after("smartquotes", "katagami_french_spacing", (state) => {
    const conventions = frenchConventions(tagOf(state.env));
    if (!conventions) return;
    for (const block of state.tokens) {
      if (block.type !== "inline") continue;
      let inUrl = false;
      for (const token of block.children) {
        if (token.type === "link_open") inUrl = token.markup === "autolink" || token.markup === "linkify";
        else if (token.type === "link_close") inUrl = false;
        else if (token.type === "text" && !inUrl) token.content = frenchSpacing(token.content, conventions);
      }
    }
  });
}
