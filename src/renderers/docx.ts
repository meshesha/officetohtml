/**
 * Word (.docx) renderer based on mammoth.js. The generated HTML is sanitised
 * (DOMPurify) and shown on paper-like pages.
 */
import { clamp, h, rtlRatio } from "../core/dom";
import { printDocument } from "../core/print";
import { sanitizeToFragment } from "../core/sanitize";
import { TextSearch } from "../core/search";
import { readZipText } from "../core/zip";
import { OfficeError } from "../errors";
import type { Renderer, RendererContext, ZoomPreset } from "../types";

const EMU_PER_PX = 9525;
const PAGE_WIDTH_PX = 794; // 21cm at 96dpi

export interface ImageSize {
  width: number;
  height: number;
}

/**
 * Display sizes of the pictures in word/document.xml, in the order mammoth
 * converts them (mc:AlternateContent → mammoth reads mc:Fallback).
 */
export function extractImageSizes(documentXml: string): Array<ImageSize | null> {
  const xml = documentXml.replace(/<mc:Choice\b[\s\S]*?<\/mc:Choice>/g, "");
  const out: Array<ImageSize | null> = [];
  const re = /<w:drawing\b[\s\S]*?<\/w:drawing>|<w:pict\b[\s\S]*?<\/w:pict>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const block = m[0];
    if (block.startsWith("<w:drawing")) {
      if (!/<a:blip\b[^>]*r:embed=/.test(block)) continue;
      const ext = /<wp:extent\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/.exec(block);
      out.push(ext ? { width: Math.round(Number(ext[1]) / EMU_PER_PX), height: Math.round(Number(ext[2]) / EMU_PER_PX) } : null);
    } else {
      if (!/<v:imagedata\b/.test(block)) continue;
      const style = /<v:shape\b[^>]*\bstyle="([^"]*)"/.exec(block)?.[1] ?? "";
      const w = /width:\s*([\d.]+)(pt|px|in|cm|mm)?/.exec(style);
      const hh = /height:\s*([\d.]+)(pt|px|in|cm|mm)?/.exec(style);
      const toPx = (v: RegExpExecArray | null) => {
        if (!v) return 0;
        const n = Number(v[1]);
        switch (v[2]) {
          case "px":
            return n;
          case "in":
            return n * 96;
          case "cm":
            return (n * 96) / 2.54;
          case "mm":
            return (n * 96) / 25.4;
          default:
            return (n * 96) / 72;
        }
      };
      const width = Math.round(toPx(w));
      const height = Math.round(toPx(hh));
      out.push(width && height ? { width, height } : null);
    }
  }
  return out;
}

let docCounter = 0;

export function createDocxRenderer(ctx: RendererContext): Renderer {
  const opts = ctx.options.docx ?? {};
  const pageView = opts.pageView ?? true;
  let zoom = opts.zoom ?? 1;
  let zoomMode: "custom" | "page-width" = "custom";
  let search: TextSearch | null = null;
  const idPrefix = `oth-d${++docCounter}-`;

  const scroller = h("div", { class: "oth-content", tabindex: "0" });
  const wrap = h("div", { class: "oth-docx" + (pageView ? "" : " oth-docx-flow") });
  const page = h("article", { class: "oth-docx-page", lang: "" });
  wrap.appendChild(page);
  scroller.appendChild(wrap);

  const applyZoom = () => {
    if (zoomMode === "page-width") {
      const avail = scroller.clientWidth - 32;
      zoom = clamp(avail / PAGE_WIDTH_PX, 0.25, 4);
    }
    (page.style as CSSStyleDeclaration & { zoom: string }).zoom = String(zoom);
  };

  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    zoomMode = "custom";
    zoom = clamp(zoom * Math.exp(-e.deltaY * 0.002), 0.25, 4);
    applyZoom();
    ctx.update();
  };

  return {
    async render() {
      const mammoth = await ctx.lib("mammoth");
      if (!mammoth?.convertToHtml) throw new OfficeError("LIBRARY_LOAD_ERROR", "mammoth.js is not available");

      const sizes = opts.imageSizes === false ? [] : extractImageSizes(readZipText(ctx.file.bytes, (n) => n === "word/document.xml")["word/document.xml"] ?? "");
      let imageCount = 0;
      const convertImage =
        opts.convertImage ??
        mammoth.images.imgElement(async (image: { read(enc: string): Promise<string>; contentType: string }) => {
          imageCount++;
          const data = await image.read("base64");
          return { src: `data:${image.contentType};base64,${data}` };
        });

      const buffer = ctx.file.bytes.slice().buffer;
      let result: { value: string; messages: Array<{ type: string; message: string }> };
      try {
        result = await mammoth.convertToHtml(
          { arrayBuffer: buffer },
          {
            styleMap: opts.styleMap,
            includeEmbeddedStyleMap: opts.includeEmbeddedStyleMap ?? true,
            includeDefaultStyleMap: opts.includeDefaultStyleMap ?? true,
            ignoreEmptyParagraphs: opts.ignoreEmptyParagraphs ?? false,
            convertImage,
            idPrefix: "",
          },
        );
      } catch (err) {
        throw new OfficeError("PARSE_ERROR", `The document could not be read: ${(err as Error)?.message ?? err}`, err);
      }
      if (ctx.signal.aborted) throw new OfficeError("ABORTED", "Loading was aborted");

      if (result.messages?.length) {
        opts.onMessages?.(result.messages);
        ctx.warn(`mammoth: ${result.messages.length} conversion message(s)`, result.messages);
      }

      const frag = sanitizeToFragment(result.value, { allowStyle: !!opts.allowInlineStyles, idPrefix });
      page.appendChild(frag);

      // image sizes (only when every picture could be matched)
      const imgs = Array.from(page.querySelectorAll("img"));
      if (sizes.length && imgs.length === sizes.length && imageCount === sizes.length) {
        imgs.forEach((img, i) => {
          const s = sizes[i];
          if (s && s.width > 0 && s.height > 0) {
            img.setAttribute("width", String(s.width));
            img.setAttribute("height", String(s.height));
          }
        });
      }
      for (const img of imgs) {
        img.loading = "lazy";
        img.decoding = "async";
      }

      // direction
      const text = page.textContent ?? "";
      const rtlSetting = opts.rtl ?? "auto";
      if (rtlSetting === "auto") {
        page.setAttribute("dir", rtlRatio(text) > 0.5 ? "rtl" : "ltr");
        page.querySelectorAll("p,li,h1,h2,h3,h4,h5,h6,td,th,blockquote,dt,dd,caption").forEach((el) => el.setAttribute("dir", "auto"));
      } else {
        page.setAttribute("dir", rtlSetting ? "rtl" : "ltr");
      }

      ctx.container.appendChild(scroller);
      if (scroller.clientWidth && scroller.clientWidth < PAGE_WIDTH_PX + 32 && pageView && opts.zoom === undefined) zoomMode = "page-width";
      applyZoom();
      scroller.addEventListener("wheel", onWheel, { passive: false });
      search = new TextSearch(page);

      // in-document links (footnotes, bookmarks): scroll inside the viewer
      page.addEventListener("click", (e) => {
        const a = (e.target as Element).closest?.("a[href^='#']");
        if (!a) return;
        const id = a.getAttribute("href")!.slice(1);
        const target = id ? page.querySelector(`#${CSS.escape(id)}`) : null;
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      });

      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      ctx.setStatus(ctx.t("words", { count: words.toLocaleString() }));
    },
    destroy() {
      scroller.removeEventListener("wheel", onWheel);
      search?.clear();
      scroller.remove();
    },
    getZoom: () => Math.round(zoom * 100) / 100,
    setZoom(z: number | ZoomPreset) {
      if (z === "page-width" || z === "auto" || z === "page-fit") zoomMode = "page-width";
      else {
        zoomMode = "custom";
        zoom = z === "page-actual" ? 1 : clamp(z, 0.25, 4);
      }
      applyZoom();
    },
    zoomPresets: ["page-width", "page-actual"],
    onResize() {
      if (zoomMode === "page-width") {
        applyZoom();
        ctx.update();
      }
    },
    search: (q, o) => search!.find(q, o),
    searchNext: () => search!.next(),
    searchPrevious: () => search!.previous(),
    clearSearch: () => search?.clear(),
    async print() {
      search?.clear();
      const clone = page.cloneNode(true) as HTMLElement;
      clone.removeAttribute("style");
      await printDocument({
        content: clone,
        title: ctx.file.name,
        dir: (page.getAttribute("dir") as "ltr" | "rtl") ?? "ltr",
        pageSize: "A4",
        margin: "20mm",
        css: PRINT_CSS,
      });
    },
    async getText() {
      return page.textContent ?? "";
    },
  };
}

const PRINT_CSS = `
body{font:11pt/1.5 Calibri,Carlito,"Segoe UI",Arial,sans-serif;color:#000}
img{max-width:100%;height:auto}
table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #bfbfbf;padding:4px 7px;vertical-align:top}
p{margin:0 0 8pt}h1{font-size:20pt;color:#2f5496;font-weight:500}h2{font-size:16pt;color:#2f5496;font-weight:500}h3{font-size:13pt;color:#1f3763;font-weight:500}
a{color:#0563c1}
`;
