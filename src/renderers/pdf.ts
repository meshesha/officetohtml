/**
 * PDF renderer based on PDF.js (pdfjs-dist) and its viewer components:
 * virtualised pages, selectable text, links/forms, search with highlighting,
 * thumbnails, outline, rotation, hand tool, presentation mode with tap/swipe
 * navigation and pinch zoom, and printing of the document only.
 *
 * Security: `isEvalSupported: false` (CVE-2024-4367 class of bugs), no PDF
 * scripting, external links open in a new tab with rel="noopener noreferrer".
 */
import { clamp, h } from "../core/dom";
import { DEFAULT_PDF_ASSETS } from "../core/libs";
import { imagesToPrintHtml, printDocument } from "../core/print";
import { OfficeError } from "../errors";
import type { Renderer, RendererContext, SearchState, ZoomPreset } from "../types";

const SCROLL_VERTICAL = 0;
const SCROLL_PAGE = 3;
const LINK_TARGET_BLANK = 2;
const PASSWORD_INCORRECT = 2;

function withSlash(u: string): string {
  return u.endsWith("/") ? u : u + "/";
}

export function createPdfRenderer(ctx: RendererContext): Renderer {
  const opts = ctx.options.pdf ?? {};
  const base = withSlash(opts.assetsBase ?? DEFAULT_PDF_ASSETS);
  let pdfjs: any;
  let viewerLib: any;
  let loadingTask: any = null;
  let pdfDoc: any = null;
  let eventBus: any = null;
  let pdfViewer: any = null;
  let linkService: any = null;
  let findController: any = null;
  let searchState: SearchState = { query: "", total: 0, current: -1 };
  let handTool = false;
  let presentation = false;
  let savedScale: string | number = "auto";
  const cleanups: Array<() => void> = [];
  const objectUrls: string[] = [];

  const container = h("div", { class: "oth-pdf", tabindex: "0" });
  const viewerEl = h("div", { class: "pdfViewer" });
  container.appendChild(viewerEl);

  const listen = <K extends keyof HTMLElementEventMap>(el: EventTarget, type: K | string, fn: (e: any) => void, o?: AddEventListenerOptions) => {
    el.addEventListener(type, fn, o);
    cleanups.push(() => el.removeEventListener(type, fn, o));
  };

  // -------------------------------------------------------------- sidebar
  let thumbsBox: HTMLElement | null = null;
  let thumbObserver: IntersectionObserver | null = null;
  const thumbButtons: HTMLButtonElement[] = [];
  let thumbQueue = Promise.resolve();

  const renderThumb = (index: number, btn: HTMLButtonElement) => {
    thumbQueue = thumbQueue.then(async () => {
      if (!pdfDoc || btn.dataset.done) return;
      btn.dataset.done = "1";
      try {
        const page = await pdfDoc.getPage(index + 1);
        const vp0 = page.getViewport({ scale: 1 });
        const scale = (120 / vp0.width) * Math.min(2, window.devicePixelRatio || 1);
        const vp = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width);
        canvas.height = Math.ceil(vp.height);
        canvas.style.height = `${Math.round((120 * vp0.height) / vp0.width)}px`;
        await page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
        btn.querySelector(".oth-thumb-ph")?.replaceWith(canvas);
      } catch {
        /* ignore thumbnail errors */
      }
    });
  };

  const buildSidebar = async () => {
    const side = ctx.sidebar.element;
    const thumbsTab = h("button", { type: "button", class: "oth-btn", "aria-pressed": "true" }, ctx.t("thumbnails"));
    const outlineTab = h("button", { type: "button", class: "oth-btn", "aria-pressed": "false" }, ctx.t("outline"));
    thumbsBox = h("div", { class: "oth-thumbs" });
    const outlineBox = h("div", { hidden: true });
    side.append(h("div", { class: "oth-side-tabs" }, thumbsTab, outlineTab), thumbsBox, outlineBox);
    const select = (outline: boolean) => {
      thumbsTab.setAttribute("aria-pressed", String(!outline));
      outlineTab.setAttribute("aria-pressed", String(outline));
      thumbsBox!.hidden = outline;
      outlineBox.hidden = !outline;
    };
    thumbsTab.addEventListener("click", () => select(false));
    outlineTab.addEventListener("click", () => select(true));

    thumbObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const btn = e.target as HTMLButtonElement;
          renderThumb(Number(btn.dataset.index), btn);
          thumbObserver?.unobserve(btn);
        }
      },
      { root: side, rootMargin: "300px 0px" },
    );
    for (let i = 0; i < pdfDoc.numPages; i++) {
      const btn = h("button", { type: "button", class: "oth-thumb", "data-index": i, "aria-label": `${ctx.t("page")} ${i + 1}` }, h("div", { class: "oth-thumb-ph" }), String(i + 1));
      btn.addEventListener("click", () => {
        pdfViewer.currentPageNumber = i + 1;
      });
      thumbButtons.push(btn);
      thumbsBox.appendChild(btn);
      thumbObserver.observe(btn);
    }

    // outline
    try {
      const outline = await pdfDoc.getOutline();
      if (!outline?.length) outlineBox.appendChild(h("p", { class: "oth-notice" }, ctx.t("noOutline")));
      else {
        const build = (items: any[]): HTMLUListElement => {
          const ul = h("ul", { class: "oth-outline" });
          for (const item of items) {
            const a = h("a", { href: "#" }, String(item.title ?? ""));
            if (item.bold) a.style.fontWeight = "600";
            if (item.italic) a.style.fontStyle = "italic";
            a.addEventListener("click", (e) => {
              e.preventDefault();
              if (item.dest) linkService.goToDestination(item.dest);
              else if (item.url && /^https?:/i.test(item.url)) window.open(item.url, "_blank", "noopener,noreferrer");
            });
            const li = h("li", {}, a);
            if (item.items?.length) li.appendChild(build(item.items));
            ul.appendChild(li);
          }
          return ul;
        };
        outlineBox.appendChild(build(outline));
      }
    } catch {
      outlineBox.appendChild(h("p", { class: "oth-notice" }, ctx.t("noOutline")));
    }
  };

  const markThumb = (page: number) => {
    thumbButtons.forEach((b, i) => b.setAttribute("aria-current", String(i === page - 1)));
    const cur = thumbButtons[page - 1];
    if (cur && ctx.sidebar.open) cur.scrollIntoView({ block: "nearest" });
  };

  // -------------------------------------------------------------- interaction
  const setHandTool = (on: boolean) => {
    handTool = on;
    container.classList.toggle("oth-hand", on);
  };

  const installGestures = () => {
    // hand tool (mouse drag to scroll)
    let drag: { x: number; y: number; sl: number; st: number } | null = null;
    listen(container, "pointerdown", (e: PointerEvent) => {
      if (!handTool || e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as Element).closest("a,input,select,textarea,button")) return;
      drag = { x: e.clientX, y: e.clientY, sl: container.scrollLeft, st: container.scrollTop };
      container.classList.add("oth-dragging");
      container.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    });
    listen(container, "pointermove", (e: PointerEvent) => {
      if (!drag) return;
      container.scrollLeft = drag.sl - (e.clientX - drag.x);
      container.scrollTop = drag.st - (e.clientY - drag.y);
    });
    const end = () => {
      drag = null;
      container.classList.remove("oth-dragging");
    };
    listen(container, "pointerup", end);
    listen(container, "pointercancel", end);

    // ctrl + wheel zoom
    listen(
      container,
      "wheel",
      (e: WheelEvent) => {
        if (!e.ctrlKey || !pdfViewer) return;
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 0.01);
        zoomBy(factor, [e.clientX, e.clientY]);
      },
      { passive: false },
    );

    // touch: pinch zoom, swipe & tap navigation (presentation mode)
    let touchStart: { x: number; y: number; t: number; dist: number; scale: number; moved: boolean } | null = null;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    listen(
      container,
      "touchstart",
      (e: TouchEvent) => {
        if (e.touches.length === 2 && (opts.pinchZoom ?? true)) {
          touchStart = { x: 0, y: 0, t: Date.now(), dist: dist(e.touches), scale: pdfViewer.currentScale, moved: true };
        } else if (e.touches.length === 1) {
          touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), dist: 0, scale: pdfViewer.currentScale, moved: false };
        }
      },
      { passive: true },
    );
    listen(
      container,
      "touchmove",
      (e: TouchEvent) => {
        if (!touchStart) return;
        if (e.touches.length === 2 && touchStart.dist > 0) {
          e.preventDefault();
          const ratio = dist(e.touches) / touchStart.dist;
          const target = clamp(touchStart.scale * ratio, 0.25, 10);
          const mid: [number, number] = [(e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2];
          zoomBy(target / pdfViewer.currentScale, mid);
        } else if (e.touches.length === 1) {
          if (Math.hypot(e.touches[0].clientX - touchStart.x, e.touches[0].clientY - touchStart.y) > 10) touchStart.moved = true;
        }
      },
      { passive: false },
    );
    listen(container, "touchend", (e: TouchEvent) => {
      const s = touchStart;
      touchStart = null;
      if (!s || s.dist > 0 || !presentation || !(opts.swipeNavigation ?? true)) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      const fwd = ctx.rtl ? -1 : 1;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - s.t < 800) {
        go(dx < 0 ? fwd : -fwd);
      } else if (!s.moved && Date.now() - s.t < 300) {
        const rect = container.getBoundingClientRect();
        const leftHalf = t.clientX < rect.left + rect.width / 2;
        go(leftHalf ? -fwd : fwd);
      }
    });
    // mouse click navigation in presentation mode
    listen(container, "click", (e: MouseEvent) => {
      if (!presentation || (e.target as Element).closest("a,input,select,textarea,button")) return;
      if ((e as PointerEvent).pointerType === "touch") return;
      go(e.button === 0 && !e.shiftKey ? 1 : -1);
    });
  };

  const go = (delta: number) => {
    if (!pdfViewer) return;
    pdfViewer.currentPageNumber = clamp(pdfViewer.currentPageNumber + delta, 1, pdfViewer.pagesCount);
  };

  const zoomBy = (factor: number, origin?: [number, number]) => {
    if (!pdfViewer) return;
    if (typeof pdfViewer.updateScale === "function") {
      pdfViewer.updateScale({ scaleFactor: factor, origin, drawingDelay: 300 });
    } else {
      pdfViewer.currentScale = clamp(pdfViewer.currentScale * factor, 0.1, 10);
    }
  };

  const setPresentation = (on: boolean) => {
    if (!pdfViewer || on === presentation) return;
    presentation = on;
    ctx.setPresentation(on);
    const page = pdfViewer.currentPageNumber;
    if (on) {
      savedScale = pdfViewer.currentScaleValue;
      pdfViewer.scrollMode = SCROLL_PAGE;
      pdfViewer.currentScaleValue = "page-fit";
      setHandTool(false);
    } else {
      pdfViewer.scrollMode = SCROLL_VERTICAL;
      pdfViewer.currentScaleValue = savedScale;
    }
    pdfViewer.currentPageNumber = page;
  };

  // -------------------------------------------------------------- search
  const find = (type: string, findPrevious = false): Promise<SearchState> => {
    if (!eventBus) return Promise.resolve(searchState);
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        eventBus.off("updatefindcontrolstate", onState);
        resolve(searchState);
      };
      const onState = () => setTimeout(done, 50);
      eventBus.on("updatefindcontrolstate", onState);
      eventBus.dispatch("find", {
        source: null,
        type,
        query: searchState.query,
        caseSensitive: !!lastCase,
        entireWord: false,
        highlightAll: true,
        findPrevious,
        matchDiacritics: false,
      });
      setTimeout(done, 1500);
    });
  };
  let lastCase = false;

  return {
    zoomPresets: ["auto", "page-fit", "page-width", "page-actual"],
    pageLabel: "page",
    async render() {
      pdfjs = await ctx.lib("pdfjs");
      const g = globalThis as any;
      if (!g.pdfjsLib) g.pdfjsLib = pdfjs;
      viewerLib = await ctx.lib("pdfjsViewer");
      if (!pdfjs?.getDocument || !viewerLib?.PDFViewer) throw new OfficeError("LIBRARY_LOAD_ERROR", "PDF.js is not available");

      const gwo = pdfjs.GlobalWorkerOptions;
      if (opts.workerPort) gwo.workerPort = opts.workerPort;
      else if (opts.workerSrc) gwo.workerSrc = opts.workerSrc;
      else if (!gwo.workerSrc && !gwo.workerPort) gwo.workerSrc = base + "build/pdf.worker.min.mjs";

      const cssReady = opts.viewerCss === false ? Promise.resolve() : ctx.injectStylesheet(opts.viewerCss || base + "web/pdf_viewer.css");

      let passwordCancelled = false;
      loadingTask = pdfjs.getDocument({
        data: ctx.file.bytes.slice(),
        isEvalSupported: false,
        enableXfa: false,
        cMapUrl: base + "cmaps/",
        cMapPacked: true,
        standardFontDataUrl: base + "standard_fonts/",
        wasmUrl: base + "wasm/",
        iccUrl: base + "iccs/",
        ...(opts.documentOptions ?? {}),
      });
      loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => total && ctx.progress(loaded / total);
      loadingTask.onPassword = (update: (pw: string) => void, reason: number) => {
        ctx.requestPassword(reason === PASSWORD_INCORRECT).then((pw) => {
          if (pw === null) {
            loadingTask?.destroy();
            passwordCancelled = true;
          } else update(pw);
        });
      };
      try {
        pdfDoc = await loadingTask.promise;
      } catch (err) {
        if (passwordCancelled || (err as { name?: string })?.name === "PasswordException") throw new OfficeError("PASSWORD_REQUIRED", ctx.t("passwordRequired"), err);
        if (ctx.signal.aborted) throw new OfficeError("ABORTED", "Loading was aborted", err);
        throw new OfficeError("PARSE_ERROR", `The PDF could not be read: ${(err as Error)?.message ?? err}`, err);
      }
      await cssReady;

      ctx.container.appendChild(container);
      eventBus = new viewerLib.EventBus();
      linkService = new viewerLib.PDFLinkService({ eventBus, externalLinkTarget: LINK_TARGET_BLANK, externalLinkRel: "noopener noreferrer nofollow" });
      findController = new viewerLib.PDFFindController({ eventBus, linkService });
      pdfViewer = new viewerLib.PDFViewer({
        container,
        viewer: viewerEl,
        eventBus,
        linkService,
        findController,
        textLayerMode: opts.textLayer === false ? 0 : 1,
        annotationMode: opts.annotations === false ? 0 : 2,
        imageResourcesPath: base + "web/images/",
        maxCanvasPixels: opts.maxCanvasPixels,
        removePageBorders: false,
      });
      linkService.setViewer(pdfViewer);

      eventBus.on("pagesinit", () => {
        const z = opts.zoom ?? "auto";
        pdfViewer.currentScaleValue = typeof z === "number" ? String(z) : z;
        if (opts.page && opts.page > 1) pdfViewer.currentPageNumber = clamp(opts.page, 1, pdfDoc.numPages);
        ctx.update();
      });
      eventBus.on("pagechanging", ({ pageNumber }: { pageNumber: number }) => {
        markThumb(pageNumber);
        ctx.update();
      });
      eventBus.on("scalechanging", () => ctx.update());
      eventBus.on("updatefindmatchescount", ({ matchesCount }: { matchesCount: { current: number; total: number } }) => {
        searchState = { query: searchState.query, total: matchesCount.total, current: matchesCount.current - 1 };
        ctx.searchUpdate(searchState);
      });
      eventBus.on("updatefindcontrolstate", ({ matchesCount }: { matchesCount?: { current: number; total: number } }) => {
        if (matchesCount) searchState = { query: searchState.query, total: matchesCount.total, current: matchesCount.current - 1 };
        ctx.searchUpdate(searchState);
      });

      pdfViewer.setDocument(pdfDoc);
      linkService.setDocument(pdfDoc, null);
      installGestures();

      // toolbar
      const tb = ctx.toolbar;
      const sideBtn = tb.button({ icon: "sidebar", label: ctx.t("sidebar"), pressed: false, onClick: async () => {
        if (!thumbsBox) await buildSidebar();
        ctx.sidebar.toggle();
        tb.setPressed(sideBtn, ctx.sidebar.open);
        markThumb(pdfViewer.currentPageNumber);
      } });
      tb.button({ icon: "rotateLeft", label: ctx.t("rotateLeft"), onClick: () => (pdfViewer.pagesRotation = (pdfViewer.pagesRotation + 270) % 360) });
      tb.button({ icon: "rotateRight", label: ctx.t("rotateRight"), onClick: () => (pdfViewer.pagesRotation = (pdfViewer.pagesRotation + 90) % 360) });
      const handBtn = tb.button({ icon: "hand", label: ctx.t("handTool"), pressed: false, onClick: () => {
        setHandTool(!handTool);
        tb.setPressed(handBtn, handTool);
      } });
      tb.button({ icon: "slideshow", label: ctx.t("presentation"), onClick: () => ctx.viewer.toggleFullscreen(true) });
      if (opts.sidebar) {
        await buildSidebar();
        ctx.sidebar.toggle(true);
        tb.setPressed(sideBtn, true);
      }

      try {
        const meta = await pdfDoc.getMetadata();
        const title = meta?.info?.Title;
        ctx.setStatus(`${pdfDoc.numPages} ${ctx.t("page").toLowerCase()}${title ? ` · ${title}` : ""}`);
      } catch {
        ctx.setStatus(`${pdfDoc.numPages} ${ctx.t("page").toLowerCase()}`);
      }
    },
    destroy() {
      cleanups.forEach((f) => f());
      thumbObserver?.disconnect();
      try {
        pdfViewer?.cleanup?.();
        pdfViewer?.setDocument?.(null);
      } catch {
        /* ignore */
      }
      pdfViewer = null;
      findController = null;
      try {
        loadingTask?.destroy();
      } catch {
        /* ignore */
      }
      loadingTask = null;
      pdfDoc = null;
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
      container.remove();
    },
    getZoom: () => (pdfViewer ? Math.round(pdfViewer.currentScale * 100) / 100 : 1),
    setZoom(z: number | ZoomPreset) {
      if (!pdfViewer) return;
      pdfViewer.currentScaleValue = typeof z === "number" ? String(z) : z;
    },
    getPageCount: () => pdfDoc?.numPages ?? 0,
    getPage: () => pdfViewer?.currentPageNumber ?? 1,
    setPage(n) {
      if (pdfViewer) pdfViewer.currentPageNumber = n;
    },
    onResize() {
      if (!pdfViewer) return;
      const v = pdfViewer.currentScaleValue;
      if (v === "auto" || v === "page-fit" || v === "page-width") pdfViewer.currentScaleValue = v;
    },
    onFullscreenChange(fs) {
      setPresentation(fs);
    },
    onKeyDown(e) {
      if (!pdfViewer) return false;
      if (presentation && ["ArrowRight", "ArrowDown", " ", "Enter", "PageDown"].includes(e.key)) go(ctx.rtl && e.key === "ArrowRight" ? -1 : 1);
      else if (presentation && ["ArrowLeft", "ArrowUp", "Backspace", "PageUp"].includes(e.key)) go(ctx.rtl && e.key === "ArrowLeft" ? 1 : -1);
      else if (e.key === "Home" && !e.ctrlKey) pdfViewer.currentPageNumber = 1;
      else if (e.key === "End" && !e.ctrlKey) pdfViewer.currentPageNumber = pdfViewer.pagesCount;
      else if (e.key === "r" && !e.ctrlKey && !e.metaKey) pdfViewer.pagesRotation = (pdfViewer.pagesRotation + 90) % 360;
      else return false;
      e.preventDefault();
      return true;
    },
    search(q, o) {
      searchState = { query: q, total: 0, current: -1 };
      lastCase = !!o.matchCase;
      return find("");
    },
    searchNext: () => find("again", false),
    searchPrevious: () => find("again", true),
    clearSearch() {
      searchState = { query: "", total: 0, current: -1 };
      eventBus?.dispatch("findbarclose", { source: null });
    },
    async print() {
      if (!pdfDoc) return;
      const urls: string[] = [];
      const dpiScale = 150 / 72;
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const rotation = (page.rotate + (pdfViewer?.pagesRotation ?? 0)) % 360;
        const vp = page.getViewport({ scale: dpiScale, rotation });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(vp.width);
        canvas.height = Math.ceil(vp.height);
        await page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport: vp, intent: "print" }).promise;
        const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/png"));
        if (blob) {
          const u = URL.createObjectURL(blob);
          urls.push(u);
          objectUrls.push(u);
        }
        canvas.width = canvas.height = 0;
        ctx.progress(i / pdfDoc.numPages);
      }
      await printDocument({ content: imagesToPrintHtml(urls), title: ctx.file.name, margin: "0" });
      urls.forEach((u) => URL.revokeObjectURL(u));
    },
    async getText() {
      if (!pdfDoc) return "";
      const parts: string[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const tc = await page.getTextContent();
        parts.push(tc.items.map((it: { str?: string; hasEOL?: boolean }) => (it.str ?? "") + (it.hasEOL ? "\n" : "")).join(""));
      }
      return parts.join("\n\f");
    },
  };
}
