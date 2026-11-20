/**
 * HTML sanitising for converted documents (docx → HTML).
 *
 * mammoth.js copies hyperlink targets from the document verbatim, so a crafted
 * .docx could contain `javascript:` links. Every HTML string produced from a
 * user file goes through DOMPurify with a strict allow-list before it touches
 * the DOM.
 */
import DOMPurify from "dompurify";

const SAFE_URL = /^(?:https?:|mailto:|tel:|#|\/(?!\/)|\.\.?\/|[^:/?#]*(?:[/?#]|$))/i;
const SAFE_IMG = /^(?:data:image\/(?:png|jpe?g|gif|bmp|webp|avif|x-icon|vnd\.microsoft\.icon|tiff);base64,|blob:|https?:)/i;

let purifier: ReturnType<typeof DOMPurify> | null = null;

function getPurifier(): ReturnType<typeof DOMPurify> {
  if (purifier) return purifier;
  const p = DOMPurify(window);
  p.addHook("uponSanitizeAttribute", (node, data) => {
    const name = data.attrName;
    if (name === "href" || name === "xlink:href") {
      if (!SAFE_URL.test(data.attrValue.trim())) data.keepAttr = false;
    } else if (name === "src") {
      const ok = node.nodeName === "IMG" && SAFE_IMG.test(data.attrValue.trim());
      if (!ok) data.keepAttr = false;
    }
  });
  p.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeName === "A") {
      const href = node.getAttribute("href") ?? "";
      if (/^(?:https?:|mailto:|tel:)/i.test(href)) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer nofollow");
      }
    }
  });
  purifier = p;
  return p;
}

export interface SanitizeOptions {
  /** Allow inline `style` attributes (default false). */
  allowStyle?: boolean;
  /**
   * Prefix added to every id/name (and to matching "#fragment" links) so the
   * document cannot clobber globals of the host page (DOM clobbering).
   * Default "oth-".
   */
  idPrefix?: string;
}

/** Prefixes ids, names and in-document links of a sanitised fragment. */
export function prefixIds(root: ParentNode, prefix: string): void {
  if (!prefix) return;
  root.querySelectorAll("[id],[name]").forEach((el) => {
    const id = el.getAttribute("id");
    if (id) el.setAttribute("id", prefix + id);
    const name = el.getAttribute("name");
    if (name) el.setAttribute("name", prefix + name);
  });
  root.querySelectorAll('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (href.length > 1) a.setAttribute("href", "#" + prefix + href.slice(1));
  });
}

const ALLOWED_TAGS = [
  "a", "abbr", "b", "blockquote", "br", "caption", "code", "col", "colgroup", "dd", "del", "div", "dl", "dt", "em",
  "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins", "kbd", "li", "mark", "ol",
  "p", "pre", "s", "small", "span", "strong", "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "id", "class", "colspan", "rowspan", "dir", "lang", "width", "height", "start", "type", "reversed", "target", "rel", "name"];

/** Returns a sanitised DocumentFragment (never a string, so it cannot be re-parsed differently). */
export function sanitizeToFragment(html: string, options: SanitizeOptions = {}): DocumentFragment {
  const frag = getPurifier().sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: options.allowStyle ? [...ALLOWED_ATTR, "style"] : ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    RETURN_DOM_FRAGMENT: true,
  }) as unknown as DocumentFragment;
  prefixIds(frag, options.idPrefix ?? "oth-");
  return frag;
}

/** Sanitised HTML string (for printing / export). */
export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
  return getPurifier().sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: options.allowStyle ? [...ALLOWED_ATTR, "style"] : ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    SANITIZE_NAMED_PROPS: true,
  }) as unknown as string;
}

/** True for URLs that are safe to put in an `href`. */
export function isSafeHref(url: string): boolean {
  return SAFE_URL.test(url.trim());
}
