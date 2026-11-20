/**
 * OfficeViewer - one Office-like viewer for PDF, Word, PowerPoint, spreadsheets,
 * images and text files.
 *
 * ```ts
 * import { OfficeViewer } from "@meshesha/officetohtml";
 * const viewer = new OfficeViewer("#viewer", { theme: "auto" });
 * await viewer.load("report.docx");
 * ```
 */
import { OfficeError } from "../errors";
import { detectFormat, EXTENSIONS, type FileKind } from "./detect";
import { clamp, clear, downloadBytes, formatBytes, h, resolveElement, svg, uniqueId } from "./dom";
import { Emitter, type Unsubscribe } from "./emitter";
import { createTranslator, isRtlLocale, resolveMessages, type Messages, type Translate } from "./i18n";
import { ICONS, KIND_COLORS, type IconName } from "./icons";
import { loadLibrary, loadStylesheet, type LibName } from "./libs";
import { readSource, type OfficeSource } from "./source";
import type { SearchState } from "./search";
import { VIEWER_CSS } from "./styles";
import type {
  LoadedFile,
  LoadOptions,
  LoadResult,
  OfficeViewerOptions,
  Renderer,
  RendererContext,
  RendererFactory,
  SidebarApi,
  Theme,
  ToolbarApi,
  ToolbarOptions,
  ToolButtonOptions,
  ViewerEvents,
  ZoomPreset,
} from "../types";

const ZOOM_STEPS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10, 15, 20];
const ZOOM_MENU = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

const BUILTIN_RENDERERS: Record<string, () => Promise<RendererFactory>> = {
  pdf: () => import("../renderers/pdf").then((m) => m.createPdfRenderer),
  docx: () => import("../renderers/docx").then((m) => m.createDocxRenderer),
  pptx: () => import("../renderers/pptx").then((m) => m.createPptxRenderer),
  sheet: () => import("../renderers/sheet").then((m) => m.createSheetRenderer),
  image: () => import("../renderers/image").then((m) => m.createImageRenderer),
  text: () => import("../renderers/text").then((m) => m.createTextRenderer),
};

const customRenderers: Record<string, RendererFactory> = {};

const LEGACY_SUGGEST: Record<string, string> = { doc: "docx", dot: "docx", ppt: "pptx", pps: "pptx", pot: "pptx", odt: "docx", odp: "pptx", rtfd: "docx", pages: "docx", key: "pptx" };

const KIND_LABEL: Record<string, string> = { pdf: "PDF", docx: "Word", pptx: "PowerPoint", sheet: "Spreadsheet", image: "Image", text: "Text" };

function injectStyle(root: Document | ShadowRoot, id: string, css: string, nonce?: string): void {
  const host = root instanceof Document ? root.head : root;
  if (!host || (root as ParentNode).querySelector?.(`style[data-oth="${id}"]`)) return;
  const style = document.createElement("style");
  style.setAttribute("data-oth", id);
  if (nonce) style.nonce = nonce;
  style.textContent = css;
  host.appendChild(style);
}

interface ToolbarRefs {
  bar: HTMLElement;
  openBtn: HTMLButtonElement;
  fileBox: HTMLElement;
  fileBadge: HTMLElement;
  fileName: HTMLElement;
  tools: HTMLElement;
  pageGroup: HTMLElement;
  pageInput: HTMLInputElement;
  pageTotal: HTMLElement;
  prevBtn: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
  zoomGroup: HTMLElement;
  zoomSelect: HTMLSelectElement;
  searchBtn: HTMLButtonElement;
  printBtn: HTMLButtonElement;
  downloadBtn: HTMLButtonElement;
  fullscreenBtn: HTMLButtonElement;
  themeBtn: HTMLButtonElement;
}

export class OfficeViewer {
  /** Registers a renderer for a kind (or replaces a built-in one) for all viewers. */
  static registerRenderer(kind: FileKind | string, factory: RendererFactory): void {
    customRenderers[kind] = factory;
  }

  readonly options: OfficeViewerOptions;
  private readonly host: HTMLElement;
  private readonly root: HTMLElement;
  private readonly emitter = new Emitter<ViewerEvents>();
  private readonly t: Translate;
  private readonly messages: Messages;
  private readonly tb: ToolbarRefs | null;
  private readonly tbOptions: Required<ToolbarOptions>;
  private readonly searchBar: HTMLElement;
  private readonly searchInput: HTMLInputElement;
  private readonly searchCount: HTMLElement;
  private readonly searchCase: HTMLInputElement;
  private readonly sidebarEl: HTMLElement;
  private readonly body: HTMLElement;
  private readonly footer: HTMLElement;
  private readonly footerTools: HTMLElement;
  private readonly statusText: HTMLElement;
  private readonly fileInput: HTMLInputElement;
  private overlay: HTMLElement | null = null;
  private dropEl: HTMLElement | null = null;
  private current: Renderer | null = null;
  private currentFile: LoadedFile | null = null;
  private controller: AbortController | null = null;
  private loadToken = 0;
  private themeSetting: Theme;
  private dark = false;
  private mql: MediaQueryList | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private cleanups: Array<() => void> = [];
  private destroyed = false;
  private rtl: boolean;
  private resizeRaf = 0;
  private rendererStatus = "";

  constructor(container: HTMLElement | string, options: OfficeViewerOptions = {}) {
    this.host = resolveElement(container);
    this.options = options;
    this.messages = resolveMessages(options.locale, options.messages);
    this.t = createTranslator(this.messages);
    this.themeSetting = options.theme ?? "auto";

    const tbo = options.toolbar === false ? {} : options.toolbar === true || options.toolbar === undefined ? {} : options.toolbar;
    const on = (k: keyof ToolbarOptions) => options.toolbar !== false && tbo[k] !== false;
    this.tbOptions = {
      open: on("open"), fileName: on("fileName"), zoom: on("zoom"), pages: on("pages"), search: on("search"),
      print: on("print"), download: on("download"), fullscreen: on("fullscreen"), theme: on("theme"), tools: on("tools"),
    };

    const rootNode = this.host.getRootNode() as Document | ShadowRoot;
    if (options.injectStyles !== false) injectStyle(rootNode instanceof ShadowRoot ? rootNode : document, "viewer", VIEWER_CSS, options.nonce);

    // existing viewer in the same container
    (this.host as any).__officeViewer?.destroy?.();
    (this.host as any).__officeViewer = this;

    this.rtl = this.resolveRtl();
    this.root = h("div", { class: "oth", dir: this.rtl ? "rtl" : "ltr", tabindex: "-1", role: "region", "aria-label": "Document viewer" });
    if (options.height !== undefined) this.root.style.height = typeof options.height === "number" ? `${options.height}px` : options.height;

    this.fileInput = h("input", { type: "file", class: "oth-sr", tabindex: "-1", "aria-hidden": "true", accept: this.acceptAttr() });
    this.fileInput.addEventListener("change", () => {
      const f = this.fileInput.files?.[0];
      if (f) this.load(f).catch(() => undefined);
      this.fileInput.value = "";
    });

    this.tb = options.toolbar === false ? null : this.buildToolbar();

    // search bar
    this.searchInput = h("input", { class: "oth-input", type: "search", placeholder: this.t("searchPlaceholder"), "aria-label": this.t("search") });
    this.searchCount = h("span", { class: "oth-search-count", "aria-live": "polite" });
    this.searchCase = h("input", { type: "checkbox" });
    this.searchBar = h(
      "div",
      { class: "oth-searchbar", role: "search", hidden: true },
      this.searchInput,
      this.iconButton("up", this.t("findPrevious"), () => this.searchStep(-1)),
      this.iconButton("down", this.t("findNext"), () => this.searchStep(1)),
      this.searchCount,
      h("label", { class: "oth-check" }, this.searchCase, this.t("matchCase")),
      h("span", { class: "oth-tb-spacer" }),
      this.iconButton("close", this.t("closeSearch"), () => this.closeSearch()),
    );
    let searchTimer = 0;
    this.searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => this.runSearch(), 250);
    });
    this.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(searchTimer);
        if (this.searchInput.value !== this.lastQuery) this.runSearch();
        else this.searchStep(e.shiftKey ? -1 : 1);
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.closeSearch();
      }
    });
    this.searchCase.addEventListener("change", () => this.runSearch());

    this.sidebarEl = h("aside", { class: "oth-sidebar", hidden: true });
    this.body = h("div", { class: "oth-body" });
    this.footerTools = h("div", { class: "oth-footer-tools" });
    this.statusText = h("div", { class: "oth-status", "aria-live": "polite" });
    this.footer = h("div", { class: "oth-footer", hidden: options.statusbar === false }, this.footerTools, this.statusText);

    this.root.append(
      ...(this.tb ? [this.tb.bar] : []),
      this.searchBar,
      h("div", { class: "oth-main" }, this.sidebarEl, this.body),
      this.footer,
      this.fileInput,
    );
    this.host.appendChild(this.root);
    if (options.height === undefined && this.host.clientHeight < 50 && this.host !== document.body) this.root.style.height = "600px";

    this.applyTheme();
    this.listen();
    this.showEmpty();
    this.refresh();
  }

  // ---------------------------------------------------------------- public API

  /** The viewer's root element. */
  get element(): HTMLElement {
    return this.root;
  }

  /** The open file (bytes, name, kind ...), or null. */
  get file(): LoadedFile | null {
    return this.currentFile;
  }

  /** The active renderer instance (exposes renderer specific methods), or null. */
  get renderer(): Renderer | null {
    return this.current;
  }

  get theme(): Theme {
    return this.themeSetting;
  }

  get isDark(): boolean {
    return this.dark;
  }

  get isRtl(): boolean {
    return this.rtl;
  }

  /** Current zoom factor (1 = 100%), or null if the document cannot be zoomed. */
  get zoom(): number | null {
    return this.current?.getZoom?.() ?? null;
  }

  /** Current page/slide/sheet (1-based), or 0. */
  get page(): number {
    return this.current?.getPage?.() ?? 0;
  }

  get pageCount(): number {
    return this.current?.getPageCount?.() ?? 0;
  }

  on<K extends keyof ViewerEvents>(event: K, handler: (payload: ViewerEvents[K]) => void): Unsubscribe {
    return this.emitter.on(event, handler);
  }

  once<K extends keyof ViewerEvents>(event: K, handler: (payload: ViewerEvents[K]) => void): Unsubscribe {
    return this.emitter.once(event, handler);
  }

  off<K extends keyof ViewerEvents>(event: K, handler: (payload: ViewerEvents[K]) => void): void {
    this.emitter.off(event, handler);
  }

  /**
   * Loads and renders a file.
   * @param source URL, File, Blob, ArrayBuffer or typed array
   */
  async load(source: OfficeSource, options: LoadOptions = {}): Promise<LoadResult> {
    this.assertAlive();
    const token = ++this.loadToken;
    this.reset();
    const controller = new AbortController();
    this.controller = controller;
    const signal = controller.signal;
    if (options.signal) {
      if (options.signal.aborted) controller.abort();
      else options.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    const displayName = options.fileName || (typeof File !== "undefined" && source instanceof File ? source.name : typeof source === "string" ? source.split(/[?#]/)[0].split("/").pop() : "") || "";
    this.emitter.emit("loadstart", { source });
    this.showLoading(displayName);
    this.setFileLabel(displayName, null);

    try {
      const data = await readSource(source, {
        fetchOptions: this.options.fetchOptions,
        signal,
        maxFileSize: this.options.maxFileSize,
        allowedProtocols: this.options.allowedProtocols,
        onProgress: (loaded, total) => {
          const ratio = total ? loaded / total : -1;
          this.setProgress(ratio);
          this.emitter.emit("progress", { phase: "download", loaded, total, ratio });
        },
      });
      this.checkToken(token);
      const name = options.fileName || data.name || displayName || "document";
      const det = detectFormat({ bytes: data.bytes, name, mime: data.mime, type: options.type });
      const file: LoadedFile = {
        bytes: data.bytes, name, mime: data.mime, ext: det.ext, kind: det.kind, format: det.format, size: data.bytes.byteLength, url: data.url,
      };
      this.currentFile = file;
      this.setFileLabel(name, file.kind);

      if (file.kind === "unsupported") {
        const ext = file.format || file.ext || "?";
        const suggest = LEGACY_SUGGEST[ext];
        throw new OfficeError(
          "UNSUPPORTED_FORMAT",
          suggest ? this.t("unsupportedLegacy", { ext, suggest }) : this.t("unsupported", { ext }),
        );
      }
      if (this.options.formats && !this.options.formats.includes(file.kind)) {
        throw new OfficeError("FORMAT_DISABLED", this.t("formatDisabled", { kind: KIND_LABEL[file.kind] ?? file.kind }));
      }

      const factory = await this.resolveFactory(file.kind);
      this.checkToken(token);
      const ctx = this.createContext(file, signal);
      const renderer = await factory(ctx);
      if (token !== this.loadToken || this.destroyed) {
        renderer.destroy();
        throw new OfficeError("ABORTED", "Loading was aborted");
      }
      this.current = renderer;
      await renderer.render();
      this.checkToken(token);
      this.hideOverlay();
      this.refresh();
      this.updateStatus();
      const result: LoadResult = { file, renderer };
      this.emitter.emit("load", result);
      return result;
    } catch (err) {
      const error = OfficeError.from(err);
      if (token === this.loadToken && !this.destroyed) {
        if (error.code === "ABORTED" && signal.aborted) {
          // aborted on purpose (close() or a new load) - nothing to show
        } else {
          this.current?.destroy();
          this.current = null;
          clear(this.body);
          this.showError(error);
          this.emitter.emit("error", { error });
        }
        this.refresh();
      }
      throw error;
    }
  }

  /** Opens the browser's file picker. */
  open(): void {
    this.assertAlive();
    this.fileInput.click();
  }

  /**
   * Loads files chosen in an `<input type="file">` (v1 `inputObjId`).
   * Returns a function that removes the listener.
   */
  bindInput(input: HTMLInputElement | string): Unsubscribe {
    const el = typeof input === "string" ? (document.getElementById(input.replace(/^#/, "")) as HTMLInputElement | null) ?? document.querySelector<HTMLInputElement>(input) : input;
    if (!el) throw new Error(`OfficeViewer.bindInput: input "${String(input)}" not found`);
    const handler = () => {
      const f = el.files?.[0];
      if (f) this.load(f).catch(() => undefined);
    };
    el.addEventListener("change", handler);
    const off = () => el.removeEventListener("change", handler);
    this.cleanups.push(off);
    return off;
  }

  /** Closes the current document and shows the empty state. */
  close(): void {
    this.assertAlive();
    this.loadToken++;
    this.reset();
    this.currentFile = null;
    this.setFileLabel("", null);
    this.showEmpty();
    this.refresh();
  }

  zoomIn(): void {
    const z = this.current?.getZoom?.();
    if (z === undefined) return;
    const next = ZOOM_STEPS.find((s) => s > z + 0.001) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
    this.setZoom(next);
  }

  zoomOut(): void {
    const z = this.current?.getZoom?.();
    if (z === undefined) return;
    const prev = [...ZOOM_STEPS].reverse().find((s) => s < z - 0.001) ?? ZOOM_STEPS[0];
    this.setZoom(prev);
  }

  /** Sets the zoom: a factor (1 = 100%) or a preset like "page-width". */
  setZoom(zoom: number | ZoomPreset): void {
    if (!this.current?.setZoom) return;
    this.current.setZoom(typeof zoom === "number" ? clamp(zoom, 0.05, 40) : zoom);
    this.refresh();
    const z = this.current.getZoom?.();
    if (z !== undefined) this.emitter.emit("zoomchange", { zoom: z });
  }

  goToPage(page: number): void {
    const r = this.current;
    if (!r?.setPage || !r.getPageCount) return;
    r.setPage(clamp(Math.round(page), 1, Math.max(1, r.getPageCount())));
    this.refresh();
  }

  nextPage(): void {
    this.goToPage(this.page + 1);
  }

  previousPage(): void {
    this.goToPage(this.page - 1);
  }

  /** Searches the document; opens the search bar. */
  async search(query: string, options: { matchCase?: boolean } = {}): Promise<SearchState | null> {
    if (!this.current?.search) return null;
    this.openSearch(false);
    this.searchInput.value = query;
    this.searchCase.checked = !!options.matchCase;
    return this.runSearch();
  }

  /** Prints only the document (not the page). */
  async print(): Promise<void> {
    if (this.current?.print) await this.current.print();
  }

  /** Downloads the original file. */
  download(): void {
    const f = this.currentFile;
    if (f) downloadBytes(f.bytes, f.name || "document", f.mime || "application/octet-stream");
  }

  /** Plain text of the document, if the renderer supports it. */
  async getText(): Promise<string> {
    return (await this.current?.getText?.()) ?? "";
  }

  get isFullscreen(): boolean {
    return typeof document !== "undefined" && document.fullscreenElement === this.root;
  }

  async toggleFullscreen(force?: boolean): Promise<void> {
    const want = force ?? !this.isFullscreen;
    try {
      if (want && !this.isFullscreen) await this.root.requestFullscreen?.();
      else if (!want && this.isFullscreen) await document.exitFullscreen?.();
    } catch (err) {
      this.emitter.emit("warning", { message: "Full screen is not available", detail: err });
    }
  }

  setTheme(theme: Theme): void {
    this.themeSetting = theme;
    this.applyTheme();
  }

  /** Re-measures the layout (call after the container was resized while hidden). */
  resize(): void {
    this.current?.onResize?.();
  }

  /** Removes the viewer, its listeners and all object URLs. */
  destroy(): void {
    if (this.destroyed) return;
    this.loadToken++;
    this.reset();
    this.destroyed = true;
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.resizeRaf);
    this.root.remove();
    if ((this.host as any).__officeViewer === this) delete (this.host as any).__officeViewer;
    this.emitter.emit("destroy", {});
    this.emitter.clear();
  }

  // ---------------------------------------------------------------- internals

  private assertAlive(): void {
    if (this.destroyed) throw new OfficeError("DESTROYED", "The viewer was destroyed");
  }

  private checkToken(token: number): void {
    if (token !== this.loadToken || this.destroyed) throw new OfficeError("ABORTED", "Loading was aborted");
  }

  private resolveRtl(): boolean {
    const d = this.options.dir ?? "auto";
    if (d === "rtl") return true;
    if (d === "ltr") return false;
    const attr = this.host.closest("[dir]")?.getAttribute("dir")?.toLowerCase();
    if (attr === "rtl") return true;
    if (attr === "ltr") return false;
    if (this.options.locale && this.options.locale !== "auto") return isRtlLocale(this.options.locale);
    try {
      return getComputedStyle(this.host).direction === "rtl";
    } catch {
      return false;
    }
  }

  private acceptAttr(): string {
    const kinds = (this.options.formats ?? (Object.keys(EXTENSIONS) as FileKind[])).filter((k) => k !== "unsupported") as Array<keyof typeof EXTENSIONS>;
    return kinds.flatMap((k) => EXTENSIONS[k] ?? []).map((e) => "." + e).join(",");
  }

  private async resolveFactory(kind: FileKind): Promise<RendererFactory> {
    const own = this.options.renderers?.[kind] ?? customRenderers[kind];
    if (own) return own;
    const lazy = BUILTIN_RENDERERS[kind];
    if (!lazy) throw new OfficeError("UNSUPPORTED_FORMAT", this.t("unsupported", { ext: kind }));
    return lazy();
  }

  private createContext(file: LoadedFile, signal: AbortSignal): RendererContext {
    const resizeRenderer = () => this.current?.onResize?.();
    const renderTools = this.tb?.tools ?? h("div");
    const toolsEnabled = this.tbOptions.tools;
    const rootNode = this.host.getRootNode() as Document | ShadowRoot;
    const styleRoot = rootNode instanceof ShadowRoot ? rootNode : document;
    const toolbar: ToolbarApi = {
      button: (o: ToolButtonOptions) => {
        const b = this.iconButton(o.icon as IconName | undefined, o.label, o.onClick, o.showLabel);
        if (o.pressed !== undefined) b.setAttribute("aria-pressed", String(o.pressed));
        if (toolsEnabled) renderTools.appendChild(b);
        return b;
      },
      separator: () => {
        const s = h("span", { class: "oth-tb-sep", role: "separator" });
        if (toolsEnabled) renderTools.appendChild(s);
        return s;
      },
      add: (el) => {
        if (toolsEnabled) renderTools.appendChild(el);
        return el;
      },
      setPressed: (b, p) => b.setAttribute("aria-pressed", String(p)),
    };
    const sidebarEl = this.sidebarEl;
    const sidebar: SidebarApi = {
      get element() {
        return sidebarEl;
      },
      get open() {
        return !sidebarEl.hidden;
      },
      toggle(force?: boolean) {
        sidebarEl.hidden = !(force ?? sidebarEl.hidden);
        resizeRenderer();
      },
    };
    return {
      viewer: this,
      container: this.body,
      toolbar,
      sidebar,
      footer: this.footerTools,
      file,
      options: this.options,
      signal,
      t: this.t,
      rtl: this.rtl,
      isDark: () => this.dark,
      lib: <T,>(name: LibName) => loadLibrary<T>(name, { ...this.options.libs, nonce: this.options.libs?.nonce ?? this.options.nonce }),
      update: () => {
        this.refresh();
        const r = this.current;
        if (r?.getPage && r.getPageCount) this.emitter.emit("pagechange", { page: r.getPage(), total: r.getPageCount() });
      },
      setStatus: (text: string) => {
        this.rendererStatus = text;
        this.updateStatus();
      },
      progress: (ratio: number) => {
        this.setProgress(ratio);
        this.emitter.emit("progress", { phase: "render", loaded: ratio, total: 1, ratio });
      },
      warn: (message: string, detail?: unknown) => this.emitter.emit("warning", { message, detail }),
      searchUpdate: (state: SearchState) => {
        if (!this.searchBar.hidden) this.showSearchState(state);
      },
      setPresentation: (on: boolean) => {
        if (on) this.root.setAttribute("data-presentation", "");
        else this.root.removeAttribute("data-presentation");
      },
      requestPassword: (retry: boolean) => this.passwordDialog(retry),
      injectCss: (id: string, css: string) => injectStyle(styleRoot, id, css, this.options.nonce),
      injectStylesheet: (url: string) => loadStylesheet(url, this.options.nonce, styleRoot),
    };
  }

  /** Destroys the renderer and clears renderer-owned UI. */
  private reset(): void {
    this.controller?.abort();
    this.controller = null;
    if (this.searchBar && !this.searchBar.hidden) this.closeSearch();
    try {
      this.current?.destroy();
    } catch (err) {
      console.error("[officetohtml] renderer destroy failed", err);
    }
    this.current = null;
    clear(this.body);
    clear(this.sidebarEl);
    this.sidebarEl.hidden = true;
    clear(this.footerTools);
    if (this.tb) clear(this.tb.tools);
    this.statusText.textContent = "";
    this.rendererStatus = "";
    this.root.removeAttribute("data-presentation");
    this.overlay = null;
  }

  private listen(): void {
    const onKey = (e: KeyboardEvent) => this.onKeyDown(e);
    this.root.addEventListener("keydown", onKey);
    this.cleanups.push(() => this.root.removeEventListener("keydown", onKey));

    const onFs = () => {
      const fs = this.isFullscreen;
      if (this.tb) {
        this.tb.fullscreenBtn.replaceChildren(svg(fs ? ICONS.exitFullscreen : ICONS.fullscreen));
        this.tb.fullscreenBtn.title = this.t(fs ? "exitFullscreen" : "fullscreen");
        this.tb.fullscreenBtn.setAttribute("aria-label", this.tb.fullscreenBtn.title);
      }
      this.current?.onFullscreenChange?.(fs);
      this.emitter.emit("fullscreenchange", { fullscreen: fs });
    };
    document.addEventListener("fullscreenchange", onFs);
    this.cleanups.push(() => document.removeEventListener("fullscreenchange", onFs));

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(this.resizeRaf);
        this.resizeRaf = requestAnimationFrame(() => this.current?.onResize?.());
      });
      this.resizeObserver.observe(this.body);
    }

    if (this.options.dropFiles !== false) {
      let depth = 0;
      const hasFiles = (e: DragEvent) => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files");
      const enter = (e: DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth++;
        if (!this.dropEl) {
          this.dropEl = h("div", { class: "oth-drop" }, this.t("dropHere"));
          this.root.appendChild(this.dropEl);
        }
      };
      const over = (e: DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      };
      const leave = () => {
        depth = Math.max(0, depth - 1);
        if (!depth) {
          this.dropEl?.remove();
          this.dropEl = null;
        }
      };
      const drop = (e: DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth = 0;
        this.dropEl?.remove();
        this.dropEl = null;
        const f = e.dataTransfer?.files?.[0];
        if (f) this.load(f).catch(() => undefined);
      };
      this.root.addEventListener("dragenter", enter);
      this.root.addEventListener("dragover", over);
      this.root.addEventListener("dragleave", leave);
      this.root.addEventListener("drop", drop);
      this.cleanups.push(() => {
        this.root.removeEventListener("dragenter", enter);
        this.root.removeEventListener("dragover", over);
        this.root.removeEventListener("dragleave", leave);
        this.root.removeEventListener("drop", drop);
      });
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.options.keyboard === false) return;
    const target = e.target as HTMLElement | null;
    const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey && (e.key === "f" || e.key === "F") && this.current?.search) {
      e.preventDefault();
      this.openSearch(true);
      return;
    }
    if (mod && !e.altKey && (e.key === "p" || e.key === "P") && this.current?.print) {
      e.preventDefault();
      this.print();
      return;
    }
    if (typing) return;
    if (this.current?.onKeyDown?.(e)) return;
    if (mod && (e.key === "+" || e.key === "=")) {
      e.preventDefault();
      this.zoomIn();
    } else if (mod && e.key === "-") {
      e.preventDefault();
      this.zoomOut();
    } else if (mod && e.key === "0") {
      e.preventDefault();
      this.setZoom(this.current?.zoomPresets?.[0] ?? 1);
    } else if (e.key === "PageDown" && this.current?.setPage) {
      e.preventDefault();
      this.nextPage();
    } else if (e.key === "PageUp" && this.current?.setPage) {
      e.preventDefault();
      this.previousPage();
    }
  }

  private applyTheme(): void {
    const setting = this.themeSetting;
    if (setting === "auto" && typeof matchMedia === "function" && !this.mql) {
      this.mql = matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => this.themeSetting === "auto" && this.applyTheme();
      this.mql.addEventListener?.("change", onChange);
      this.cleanups.push(() => this.mql?.removeEventListener?.("change", onChange));
    }
    const dark = setting === "dark" || (setting === "auto" && !!this.mql?.matches);
    const changed = dark !== this.dark;
    this.dark = dark;
    this.root.setAttribute("data-theme", dark ? "dark" : "light");
    if (this.tb) {
      this.tb.themeBtn.replaceChildren(svg(dark ? ICONS.sun : ICONS.moon));
      this.tb.themeBtn.title = this.t(dark ? "lightMode" : "darkMode");
      this.tb.themeBtn.setAttribute("aria-label", this.tb.themeBtn.title);
    }
    if (changed) {
      this.current?.onThemeChange?.(dark);
      this.emitter.emit("themechange", { theme: setting, dark });
    }
  }

  // ---------------------------------------------------------------- toolbar

  private iconButton(icon: IconName | string | undefined, label: string, onClick: (e: MouseEvent) => void, showLabel = false): HTMLButtonElement {
    const b = h("button", { type: "button", class: "oth-btn", title: label, "aria-label": label });
    const markup = icon ? (ICONS as Record<string, string>)[icon] ?? (icon.trim().startsWith("<svg") ? icon : undefined) : undefined;
    if (markup) b.appendChild(svg(markup));
    if (showLabel || !markup) b.append(h("span", {}, label));
    b.addEventListener("click", onClick);
    return b;
  }

  private buildToolbar(): ToolbarRefs {
    const o = this.tbOptions;
    const t = this.t;
    const openBtn = this.iconButton("open", t("open"), () => this.open());
    const fileBadge = h("span", { class: "oth-badge", hidden: true });
    const fileName = h("span", { class: "oth-file-name" });
    const fileBox = h("div", { class: "oth-file", hidden: true }, fileBadge, fileName);
    const tools = h("div", { class: "oth-tb-group oth-tools", role: "group" });

    const prevBtn = this.iconButton(this.rtl ? "next" : "prev", t("previousPage"), () => this.previousPage());
    const nextBtn = this.iconButton(this.rtl ? "prev" : "next", t("nextPage"), () => this.nextPage());
    const pageInput = h("input", { class: "oth-input oth-page-input", type: "text", inputmode: "numeric", "aria-label": t("page") });
    const pageTotal = h("span", { class: "oth-page-label" });
    pageInput.addEventListener("change", () => {
      const n = parseInt(pageInput.value, 10);
      if (Number.isFinite(n)) this.goToPage(n);
      else this.refresh();
    });
    pageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    });
    const pageGroup = h("div", { class: "oth-tb-group", role: "group", hidden: true }, prevBtn, pageInput, pageTotal, nextBtn);

    const zoomSelect = h("select", { class: "oth-select oth-zoom-select", "aria-label": "Zoom" });
    zoomSelect.addEventListener("change", () => {
      const v = zoomSelect.value;
      const n = Number(v);
      this.setZoom(Number.isFinite(n) && v !== "" ? n : (v as ZoomPreset));
    });
    const zoomGroup = h(
      "div",
      { class: "oth-tb-group", role: "group", hidden: true },
      this.iconButton("zoomOut", t("zoomOut"), () => this.zoomOut()),
      zoomSelect,
      this.iconButton("zoomIn", t("zoomIn"), () => this.zoomIn()),
    );

    const searchBtn = this.iconButton("search", t("search"), () => (this.searchBar.hidden ? this.openSearch(true) : this.closeSearch()));
    const printBtn = this.iconButton("print", t("print"), () => this.print());
    const downloadBtn = this.iconButton("download", t("download"), () => this.download());
    const fullscreenBtn = this.iconButton("fullscreen", t("fullscreen"), () => this.toggleFullscreen());
    const themeBtn = this.iconButton("moon", t("darkMode"), () => this.setTheme(this.dark ? "light" : "dark"));
    printBtn.classList.add("oth-hide-sm");
    themeBtn.classList.add("oth-hide-sm");

    const bar = h(
      "div",
      { class: "oth-toolbar", role: "toolbar", "aria-label": "Document toolbar" },
      h("div", { class: "oth-tb-group" }, o.open ? openBtn : null),
      o.fileName ? fileBox : null,
      h("span", { class: "oth-tb-spacer" }),
      tools,
      o.pages ? pageGroup : null,
      o.zoom ? zoomGroup : null,
      h("span", { class: "oth-tb-spacer" }),
      h(
        "div",
        { class: "oth-tb-group" },
        o.search ? searchBtn : null,
        o.print ? printBtn : null,
        o.download ? downloadBtn : null,
        o.fullscreen && typeof document !== "undefined" && document.fullscreenEnabled !== false ? fullscreenBtn : null,
        o.theme ? themeBtn : null,
      ),
    );
    return { bar, openBtn, fileBox, fileBadge, fileName, tools, pageGroup, pageInput, pageTotal, prevBtn, nextBtn, zoomGroup, zoomSelect, searchBtn, printBtn, downloadBtn, fullscreenBtn, themeBtn };
  }

  private setFileLabel(name: string, kind: FileKind | null): void {
    if (!this.tb) return;
    this.tb.fileBox.hidden = !name;
    this.tb.fileName.textContent = name;
    this.tb.fileName.title = name;
    const badge = this.tb.fileBadge;
    if (kind && kind !== "unsupported") {
      badge.hidden = false;
      const ext = this.currentFile?.ext || kind;
      badge.textContent = ext.slice(0, 4);
      badge.style.background = KIND_COLORS[kind] ?? "";
    } else badge.hidden = true;
  }

  /** Syncs the toolbar with the renderer's state. */
  private refresh(): void {
    const tb = this.tb;
    if (!tb) return;
    const r = this.current;
    const t = this.t;

    const count = r?.getPageCount?.() ?? 0;
    const showPages = !!r?.setPage && count > 0 && r.pageLabel !== "sheet";
    tb.pageGroup.hidden = !showPages;
    if (showPages) {
      const p = r!.getPage?.() ?? 1;
      if (document.activeElement !== tb.pageInput) tb.pageInput.value = String(p);
      tb.pageTotal.textContent = t("pageOf", { total: count });
      tb.prevBtn.disabled = p <= 1;
      tb.nextBtn.disabled = p >= count;
      const unit = t(r!.pageLabel === "slide" ? "slide" : "page");
      tb.pageInput.setAttribute("aria-label", unit);
    }

    const zoom = r?.getZoom?.();
    tb.zoomGroup.hidden = zoom === undefined || !r?.setZoom;
    if (zoom !== undefined) {
      const sel = tb.zoomSelect;
      clear(sel);
      const presetLabel: Record<ZoomPreset, string> = { auto: t("zoomFit"), "page-fit": t("zoomPage"), "page-width": t("zoomWidth"), "page-actual": t("actualSize") };
      for (const p of r?.zoomPresets ?? []) sel.appendChild(h("option", { value: p }, presetLabel[p]));
      const pct = Math.round(zoom * 100);
      const levels = ZOOM_MENU.includes(zoom) ? ZOOM_MENU : [...ZOOM_MENU, zoom].sort((a, b) => a - b);
      for (const z of levels) sel.appendChild(h("option", { value: String(z) }, `${Math.round(z * 100)}%`));
      sel.value = String(zoom);
      // keep the percentage visible even when a preset is active
      if (sel.value !== String(zoom)) {
        sel.appendChild(h("option", { value: String(zoom) }, `${pct}%`));
        sel.value = String(zoom);
      }
    }

    tb.searchBtn.hidden = !r?.search;
    tb.printBtn.hidden = !r?.print;
    tb.downloadBtn.hidden = !this.currentFile;
    tb.fullscreenBtn.hidden = false;
  }

  private updateStatus(): void {
    const f = this.currentFile;
    const parts: string[] = [];
    if (this.rendererStatus) parts.push(this.rendererStatus);
    if (f) parts.push(formatBytes(f.size));
    this.statusText.textContent = parts.join("  ·  ");
  }

  // ---------------------------------------------------------------- search

  private lastQuery = "";

  private openSearch(focus: boolean): void {
    if (!this.current?.search) return;
    this.searchBar.hidden = false;
    this.tb?.searchBtn.setAttribute("aria-pressed", "true");
    if (focus) {
      this.searchInput.focus();
      this.searchInput.select();
    }
  }

  private closeSearch(): void {
    this.searchBar.hidden = true;
    this.tb?.searchBtn.setAttribute("aria-pressed", "false");
    this.current?.clearSearch?.();
    this.searchCount.textContent = "";
    this.lastQuery = "";
  }

  private async runSearch(): Promise<SearchState | null> {
    const r = this.current;
    if (!r?.search) return null;
    const q = this.searchInput.value;
    this.lastQuery = q;
    if (!q) {
      r.clearSearch?.();
      this.searchCount.textContent = "";
      return null;
    }
    const state = await r.search(q, { matchCase: this.searchCase.checked });
    this.showSearchState(state);
    return state;
  }

  private async searchStep(dir: 1 | -1): Promise<void> {
    const r = this.current;
    if (!r) return;
    if (this.searchInput.value !== this.lastQuery) {
      await this.runSearch();
      return;
    }
    const fn = dir > 0 ? r.searchNext : r.searchPrevious;
    if (!fn) return;
    const state = await fn.call(r);
    this.showSearchState(state);
  }

  private showSearchState(state: SearchState): void {
    this.searchCount.textContent = !state.query
      ? ""
      : state.total
        ? this.t("matchesCount", { current: state.current + 1, total: state.total })
        : this.t("noMatches");
  }

  // ---------------------------------------------------------------- overlays

  private setOverlay(...children: Array<Node | null>): HTMLElement {
    this.overlay?.remove();
    const ov = h("div", { class: "oth-overlay" }, ...children);
    this.overlay = ov;
    this.body.appendChild(ov);
    return ov;
  }

  private hideOverlay(): void {
    this.overlay?.remove();
    this.overlay = null;
  }

  private showEmpty(): void {
    const icon = h("div", { class: "oth-overlay-icon", style: `background:var(--oth-accent)` }, svg(ICONS.upload));
    const btn = this.iconButton("open", this.t("open"), () => this.open(), true);
    btn.classList.add("oth-btn-primary");
    this.setOverlay(
      icon,
      h("div", { class: "oth-overlay-title" }, this.t("emptyTitle")),
      h("div", { class: "oth-overlay-text" }, this.t("emptyHint")),
      this.tbOptions.open ? btn : null,
    );
  }

  private showLoading(name: string): void {
    const bar = h("div", { class: "oth-progress", "data-indeterminate": true }, h("div"));
    this.setOverlay(
      h("div", { class: "oth-spinner", role: "progressbar", "aria-label": this.t("loading") }),
      h("div", { class: "oth-overlay-text" }, name ? this.t("loadingFile", { name }) : this.t("loading")),
      bar,
    );
  }

  private setProgress(ratio: number): void {
    const bar = this.overlay?.querySelector<HTMLElement>(".oth-progress");
    if (!bar) return;
    if (ratio < 0 || !Number.isFinite(ratio)) {
      bar.setAttribute("data-indeterminate", "");
      return;
    }
    bar.removeAttribute("data-indeterminate");
    (bar.firstElementChild as HTMLElement).style.width = `${Math.round(clamp(ratio, 0, 1) * 100)}%`;
  }

  private showError(error: OfficeError): void {
    const t = this.t;
    const unsupported = error.code === "UNSUPPORTED_FORMAT" || error.code === "FORMAT_DISABLED";
    let text = error.message;
    if (error.code === "FILE_TOO_LARGE") text = t("fileTooLarge");
    else if (error.code === "INVALID_URL") text = t("invalidUrl");
    else if (error.code === "LIBRARY_LOAD_ERROR") text = t("libraryError");
    else if (error.code === "PASSWORD_REQUIRED") text = t("passwordRequired");
    const kind = this.currentFile?.kind;
    const icon = h("div", { class: "oth-overlay-icon", style: `background:${unsupported ? KIND_COLORS.unsupported : "#dc2626"}` }, svg(unsupported ? ICONS.file : ICONS.alert));
    const actions = h("div", { class: "oth-dialog-actions", style: "justify-content:center" });
    if (this.currentFile && this.tbOptions.download) {
      const d = this.iconButton("download", t("download"), () => this.download(), true);
      d.classList.add("oth-btn-primary");
      actions.appendChild(d);
    }
    if (this.tbOptions.open) actions.appendChild(this.iconButton("open", t("open"), () => this.open(), true));
    const ov = this.setOverlay(
      icon,
      h("div", { class: "oth-overlay-title" }, t(unsupported ? "unsupportedTitle" : "errorTitle")),
      h("div", { class: "oth-overlay-text" }, text),
      this.currentFile ? h("div", { class: "oth-overlay-text", style: "font-size:12px" }, `${this.currentFile.name} · ${formatBytes(this.currentFile.size)}`) : null,
      actions,
    );
    ov.setAttribute("role", "alert");
    void kind;
  }

  private passwordDialog(retry: boolean): Promise<string | null> {
    return new Promise((resolve) => {
      const id = uniqueId("pw");
      const input = h("input", { class: "oth-input", type: "password", id, autocomplete: "off" });
      const form = h(
        "form",
        { class: "oth-dialog" },
        h("div", { style: "display:flex;align-items:center;gap:10px" }, svg(ICONS.lock), h("strong", {}, this.t("passwordRequired"))),
        retry ? h("div", { class: "oth-error-text", role: "alert" }, this.t("passwordIncorrect")) : null,
        h("label", { for: id, class: "oth-muted" }, this.t("password")),
        input,
        h(
          "div",
          { class: "oth-dialog-actions" },
          h("button", { type: "button", class: "oth-btn", "data-cancel": true }, this.t("cancel")),
          h("button", { type: "submit", class: "oth-btn oth-btn-primary" }, this.t("submit")),
        ),
      );
      const ov = this.setOverlay(form);
      const finish = (value: string | null) => {
        ov.remove();
        if (this.overlay === ov) this.overlay = null;
        resolve(value);
      };
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = input.value;
        this.showLoading(this.currentFile?.name ?? "");
        finish(v);
      });
      form.querySelector("[data-cancel]")!.addEventListener("click", () => finish(null));
      setTimeout(() => input.focus(), 0);
    });
  }
}
