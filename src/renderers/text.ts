/** Plain text / source code / JSON / XML viewer. Content is always inserted as text, never as HTML. */
import { h } from "../core/dom";
import { printDocument } from "../core/print";
import { TextSearch } from "../core/search";
import type { Renderer, RendererContext } from "../types";

const DEFAULT_MAX = 5_000_000;
const MAX_LINE_ELEMENTS = 100_000;

/** Decodes bytes as UTF-8 / UTF-16 (BOM aware). */
export function decodeText(bytes: Uint8Array): { text: string; encoding: string } {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return { text: new TextDecoder("utf-16le").decode(bytes.subarray(2)), encoding: "UTF-16 LE" };
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return { text: new TextDecoder("utf-16be").decode(bytes.subarray(2)), encoding: "UTF-16 BE" };
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return { text: new TextDecoder("utf-8").decode(bytes.subarray(3)), encoding: "UTF-8 BOM" };
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), encoding: "UTF-8" };
  } catch {
    return { text: new TextDecoder("windows-1252").decode(bytes), encoding: "Windows-1252" };
  }
}

export function createTextRenderer(ctx: RendererContext): Renderer {
  const opts = ctx.options.text ?? {};
  let wrap = opts.wrap ?? true;
  let lines = opts.lineNumbers ?? true;
  let zoom = opts.zoom ?? 1;
  let text = "";
  let search: TextSearch | null = null;

  const scroller = h("div", { class: "oth-content", tabindex: "0" });
  const code = h("pre", { class: "oth-text-code" });
  const box = h("div", { class: "oth-text" }, code);
  scroller.appendChild(box);

  const applyLayout = () => {
    box.classList.toggle("oth-wrap", wrap);
    box.classList.toggle("oth-no-lines", !lines);
    box.style.fontSize = `${13 * zoom}px`;
  };

  return {
    async render() {
      const decoded = decodeText(ctx.file.bytes);
      text = decoded.text;
      const max = opts.maxLength ?? DEFAULT_MAX;
      let truncated = false;
      if (text.length > max) {
        text = text.slice(0, max);
        truncated = true;
      }
      if ((opts.formatJson ?? true) && /^(json|jsonc|map|webmanifest)$/.test(ctx.file.ext) && text.length < 20_000_000) {
        try {
          text = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          /* not valid JSON: show as is */
        }
      }
      const rows = text.split("\n");
      const count = rows.length;
      if (count <= MAX_LINE_ELEMENTS) {
        // one block per line: line numbers stay aligned when lines wrap
        const frag = document.createDocumentFragment();
        for (const row of rows) {
          const line = document.createElement("span");
          line.className = "oth-line";
          line.textContent = row + "\n";
          frag.appendChild(line);
        }
        code.appendChild(frag);
        box.style.setProperty("--oth-digits", String(String(count).length));
      } else {
        code.textContent = text;
        lines = false;
      }
      ctx.container.appendChild(scroller);
      search = new TextSearch(code);
      applyLayout();

      const wrapBtn = ctx.toolbar.button({ icon: "wrap", label: ctx.t("wrapLines"), pressed: wrap, onClick: () => {
        wrap = !wrap;
        ctx.toolbar.setPressed(wrapBtn, wrap);
        applyLayout();
      } });
      const lineBtn = ctx.toolbar.button({ icon: "lineNumbers", label: ctx.t("lineNumbers"), pressed: lines, onClick: () => {
        lines = !lines;
        ctx.toolbar.setPressed(lineBtn, lines);
        applyLayout();
      } });
      ctx.setStatus(`${count.toLocaleString()} lines · ${decoded.encoding}${truncated ? " · truncated" : ""}`);
    },
    destroy() {
      search?.clear();
      scroller.remove();
    },
    getZoom: () => zoom,
    setZoom(z) {
      zoom = typeof z === "number" ? Math.min(4, Math.max(0.5, z)) : 1;
      applyLayout();
    },
    zoomPresets: ["page-actual"],
    search: (q, o) => search!.find(q, o),
    searchNext: () => search!.next(),
    searchPrevious: () => search!.previous(),
    clearSearch: () => search?.clear(),
    async print() {
      const pre = document.createElement("pre");
      pre.textContent = text;
      await printDocument({
        content: pre,
        title: ctx.file.name,
        css: "pre{white-space:pre-wrap;overflow-wrap:anywhere;font:10pt/1.45 ui-monospace,Menlo,Consolas,monospace;margin:0}",
      });
    },
    async getText() {
      return text;
    },
  };
}
