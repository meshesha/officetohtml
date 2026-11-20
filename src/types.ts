import type { FileKind } from "./core/detect";
import type { LibraryOptions, LibName } from "./core/libs";
import type { Messages, Translate } from "./core/i18n";
import type { SearchState } from "./core/search";
import type { OfficeError } from "./errors";
import type { OfficeSource } from "./core/source";

export type { FileKind, OfficeSource, SearchState };

export type Theme = "light" | "dark" | "auto";

/** Named zoom levels. Renderers support a subset (see `Renderer.zoomPresets`). */
export type ZoomPreset = "auto" | "page-fit" | "page-width" | "page-actual";

// ------------------------------------------------------------------ options

export interface ToolbarOptions {
  /** "Open file" button (default true). */
  open?: boolean;
  /** File name label (default true). */
  fileName?: boolean;
  /** Zoom controls when the renderer supports zoom (default true). */
  zoom?: boolean;
  /** Page navigation when the renderer has pages (default true). */
  pages?: boolean;
  /** Search button when the renderer supports search (default true). */
  search?: boolean;
  /** Print button (default true). */
  print?: boolean;
  /** Download button (default true). */
  download?: boolean;
  /** Full screen button (default true). */
  fullscreen?: boolean;
  /** Light/dark toggle (default true). */
  theme?: boolean;
  /** Renderer specific buttons (rotate, slideshow, sidebar ...) (default true). */
  tools?: boolean;
}

export interface PdfOptions {
  /**
   * Base URL of the PDF.js assets: `build/pdf.worker.min.mjs`, `cmaps/`,
   * `standard_fonts/`, `wasm/` and `web/pdf_viewer.css`. Default: the
   * version-pinned jsDelivr URL of `pdfjs-dist`. To self-host, copy
   * `node_modules/pdfjs-dist` (those folders) to your server and point here.
   */
  assetsBase?: string;
  /** Worker URL (overrides `assetsBase`). */
  workerSrc?: string;
  /** A ready Worker / port to reuse (see PDF.js `GlobalWorkerOptions.workerPort`). */
  workerPort?: Worker;
  /** Viewer stylesheet URL, or `false` if you include `pdf_viewer.css` yourself. */
  viewerCss?: string | false;
  /** Initial zoom: a factor (1 = 100%) or a preset (default "auto"). */
  zoom?: number | ZoomPreset;
  /** Initial page (1-based, default 1). */
  page?: number;
  /** Selectable text layer (default true). Set false for faster rendering (PR #16). */
  textLayer?: boolean;
  /** Render form fields and link annotations (default true). */
  annotations?: boolean;
  /** Show the thumbnails/outline sidebar initially (default false). */
  sidebar?: boolean;
  /** Pinch-to-zoom on touch screens (default true) (PR #16). */
  pinchZoom?: boolean;
  /** Swipe / tap left-right to change pages in presentation mode (default true) (PR #16). */
  swipeNavigation?: boolean;
  /** Maximum canvas size in pixels (PDF.js `maxCanvasPixels`). */
  maxCanvasPixels?: number;
  /** Extra options passed to PDF.js `getDocument()` (e.g. `{ password }`, `httpHeaders`). */
  documentOptions?: Record<string, unknown>;
}

export interface DocxOptions {
  /** mammoth.js style map (string or array of rules). */
  styleMap?: string | string[];
  includeEmbeddedStyleMap?: boolean;
  includeDefaultStyleMap?: boolean;
  ignoreEmptyParagraphs?: boolean;
  /** `"auto"` (default) detects the direction of every paragraph, or force `true`/`false`. */
  rtl?: "auto" | boolean;
  /** Show the document on paper-like pages (default true). */
  pageView?: boolean;
  /** Restore image sizes from the document (default true) (issue #12). */
  imageSizes?: boolean;
  /** Initial zoom factor (default 1). */
  zoom?: number;
  /** Allow mammoth's inline styles (default false). */
  allowInlineStyles?: boolean;
  /** Custom mammoth `convertImage` handler. */
  convertImage?: unknown;
  /** Called with mammoth's conversion warnings. */
  onMessages?: (messages: Array<{ type: string; message: string }>) => void;
}

export interface PptxOptions {
  /** "list" shows all slides (default), "slideshow" one at a time. */
  mode?: "list" | "slideshow";
  /** Slide scale: "fit" (default), "contain" or a factor. */
  scale?: "fit" | "contain" | number;
  /** Extra options passed to the PPTXjs v2 `PptxViewer`. */
  viewerOptions?: Record<string, unknown>;
}

export interface SheetOptions {
  /**
   * "handsontable" (default when available) for an Excel-like grid, or
   * "table" for a lightweight read-only HTML table (no extra library).
   */
  engine?: "handsontable" | "table";
  /**
   * Handsontable license key. The default "non-commercial-and-evaluation"
   * is only valid for non-commercial use - see https://handsontable.com/docs/license-key/
   */
  licenseKey?: string;
  /** Read only (default true). */
  readOnly?: boolean;
  /** Row numbers (default true). */
  rowHeaders?: boolean;
  /** Column letters (default true). */
  colHeaders?: boolean;
  /** Show a formula bar with the selected cell's address and value (default true). */
  formulaBar?: boolean;
  /** Sort by clicking column headers (default false). */
  columnSorting?: boolean;
  /** Right-click menu (default false). */
  contextMenu?: boolean;
  /** Frozen rows / columns. */
  fixedRowsTop?: number;
  fixedColumnsStart?: number;
  /** Initial sheet: index or name (default 0). */
  activeSheet?: number | string;
  /** Hide hidden sheets (default true). */
  skipHiddenSheets?: boolean;
  /** Max rows for the "table" engine (default 5000). */
  maxRows?: number;
  /** Handsontable language code, e.g. "de-DE" (the language must be registered). */
  language?: string;
  /** Extra Handsontable settings. */
  handsontableSettings?: Record<string, unknown>;
  /** Extra options passed to `XLSX.read`. */
  readOptions?: Record<string, unknown>;
}

export interface ImageOptions {
  /** Initial zoom: "auto" fits large images (default), "page-actual" = 100%, or a factor. */
  zoom?: number | ZoomPreset;
  /** Maximum zoom factor (default 20 = 2000%). */
  maxZoom?: number;
  /** Zoom step factor (default 1.25). */
  zoomStep?: number;
  /** Mouse wheel zooms without Ctrl (default true). */
  wheelZoom?: boolean;
  /** Show the transparency checkerboard (default false). */
  checkerboard?: boolean;
  /** Background color of the stage. */
  background?: string;
}

export interface TextOptions {
  /** Wrap long lines (default true). */
  wrap?: boolean;
  /** Line numbers (default true). */
  lineNumbers?: boolean;
  /** Pretty-print JSON (default true). */
  formatJson?: boolean;
  /** Maximum characters to show (default 5 000 000). */
  maxLength?: number;
  /** Initial font zoom factor (default 1). */
  zoom?: number;
}

export interface OfficeViewerOptions {
  /** Toolbar on/off or per-button settings (default true). */
  toolbar?: boolean | ToolbarOptions;
  /** Status bar at the bottom (default true). */
  statusbar?: boolean;
  /** "light", "dark" or "auto" (follows the OS, default). */
  theme?: Theme;
  /** UI direction: "auto" (default: from the locale/container), "ltr" or "rtl". */
  dir?: "auto" | "ltr" | "rtl";
  /** Viewer height, e.g. 600 or "80vh". Default: fills the container (min 400px). */
  height?: number | string;
  /** UI language code ("en", "he", "ar", "es", "fr", "de", "ru", "zh" or registered). Default: browser language. */
  locale?: string;
  /** Override individual UI strings. */
  messages?: Partial<Messages>;
  /** Accept dropped files (default true). */
  dropFiles?: boolean;
  /** Formats that may be opened (default: all). */
  formats?: FileKind[];
  /** Maximum file size in bytes (default 200 MB, 0 = unlimited). */
  maxFileSize?: number;
  /** Extra `fetch()` options (headers, credentials ...) for URL sources (issue #11). */
  fetchOptions?: RequestInit;
  /** Allowed URL protocols (default http:, https:, blob:, data:). */
  allowedProtocols?: string[];
  /** Inject the viewer stylesheet into the page (default true). Disable for strict CSP and link `style.css`. */
  injectStyles?: boolean;
  /** CSP nonce for injected <style>, <link> and <script> elements. */
  nonce?: string;
  /** Third-party library loading (see {@link LibraryOptions}). */
  libs?: LibraryOptions;
  /** Keyboard shortcuts while the viewer has focus (default true). */
  keyboard?: boolean;
  /** Extra / replacement renderers keyed by kind. */
  renderers?: Partial<Record<FileKind | string, RendererFactory>>;
  pdf?: PdfOptions;
  docx?: DocxOptions;
  pptx?: PptxOptions;
  sheet?: SheetOptions;
  image?: ImageOptions;
  text?: TextOptions;
}

export interface LoadOptions {
  /** File name (used for type detection, display and downloads). */
  fileName?: string;
  /** Force a format: a kind ("pdf", "sheet" ...) or an extension ("xlsx"). */
  type?: string;
  /** Cancels loading. */
  signal?: AbortSignal;
}

// ------------------------------------------------------------------ files & events

export interface LoadedFile {
  bytes: Uint8Array;
  name: string;
  mime: string;
  ext: string;
  kind: FileKind;
  /** For unsupported files: the detected legacy format (doc, ppt, odt ...). */
  format?: string;
  size: number;
  url?: string;
}

export interface LoadResult {
  file: LoadedFile;
  renderer: Renderer;
}

export interface ViewerEvents {
  /** A file starts loading. */
  loadstart: { source: OfficeSource };
  /** Download / render progress, ratio 0..1 (or -1 if unknown). */
  progress: { phase: "download" | "render"; loaded: number; total: number; ratio: number };
  /** The file has been rendered. */
  load: LoadResult;
  /** Loading or rendering failed. */
  error: { error: OfficeError };
  /** Non-fatal problem (e.g. mammoth conversion warnings). */
  warning: { message: string; detail?: unknown };
  /** Current page / slide / sheet changed (1-based). */
  pagechange: { page: number; total: number };
  /** Zoom factor changed (1 = 100%). */
  zoomchange: { zoom: number };
  /** Theme changed. */
  themechange: { theme: Theme; dark: boolean };
  /** Full screen toggled. */
  fullscreenchange: { fullscreen: boolean };
  /** The viewer was destroyed. */
  destroy: Record<string, never>;
}

// ------------------------------------------------------------------ renderer API

export interface ToolButtonOptions {
  icon?: string;
  label: string;
  /** Show the label next to the icon (default false = icon only). */
  showLabel?: boolean;
  onClick: (ev: MouseEvent) => void;
  /** Toggle buttons get aria-pressed. */
  pressed?: boolean;
}

/** Lets renderers add their own toolbar controls. */
export interface ToolbarApi {
  button(options: ToolButtonOptions): HTMLButtonElement;
  separator(): HTMLElement;
  /** Appends any element (select, input ...). */
  add(el: HTMLElement): HTMLElement;
  setPressed(button: HTMLButtonElement, pressed: boolean): void;
}

export interface SidebarApi {
  /** The sidebar content element. */
  readonly element: HTMLElement;
  readonly open: boolean;
  toggle(force?: boolean): void;
}

export interface RendererContext {
  readonly viewer: import("./core/viewer").OfficeViewer;
  /** The element the renderer draws into. */
  readonly container: HTMLElement;
  readonly toolbar: ToolbarApi;
  /** Left side panel (thumbnails, outline ...). */
  readonly sidebar: SidebarApi;
  /** Renderer area of the status bar (e.g. sheet tabs). */
  readonly footer: HTMLElement;
  readonly file: LoadedFile;
  readonly options: OfficeViewerOptions;
  readonly signal: AbortSignal;
  readonly t: Translate;
  readonly rtl: boolean;
  /** True when the dark theme is active. */
  isDark(): boolean;
  /** Loads a third-party library (see LibraryOptions). */
  lib<T = any>(name: LibName): Promise<T>;
  /** Asks the shell to refresh toolbar state (page number, zoom ...). */
  update(): void;
  /** Sets the renderer's status bar text. */
  setStatus(text: string): void;
  /** Reports render progress (0..1). */
  progress(ratio: number): void;
  warn(message: string, detail?: unknown): void;
  /** Pushes an asynchronous search result update to the search bar. */
  searchUpdate(state: SearchState): void;
  /** Toggles presentation styling on the viewer root. */
  setPresentation(on: boolean): void;
  /** Shows a password dialog. Resolves with null if cancelled. */
  requestPassword(retry: boolean): Promise<string | null>;
  /** Adds a <style> element once per document (keyed by id). */
  injectCss(id: string, css: string): void;
  /** Adds a stylesheet <link> once. */
  injectStylesheet(url: string): Promise<void>;
}

/** A renderer draws one file into `ctx.container`. Optional members are capabilities. */
export interface Renderer {
  render(): Promise<void>;
  destroy(): void;

  getZoom?(): number;
  setZoom?(zoom: number | ZoomPreset): void;
  /** Presets offered in the zoom menu. */
  zoomPresets?: ZoomPreset[];

  getPageCount?(): number;
  /** 1-based. */
  getPage?(): number;
  setPage?(page: number): void;
  /** Label of a page unit ("page", "slide", "sheet"). */
  pageLabel?: "page" | "slide" | "sheet";

  search?(query: string, options: { matchCase?: boolean }): Promise<SearchState> | SearchState;
  searchNext?(): Promise<SearchState> | SearchState;
  searchPrevious?(): Promise<SearchState> | SearchState;
  clearSearch?(): void;

  /** Prints the document only. */
  print?(): Promise<void>;
  /** Plain text of the document (for indexing / copy). */
  getText?(): Promise<string>;

  onThemeChange?(dark: boolean): void;
  onResize?(): void;
  onFullscreenChange?(fullscreen: boolean): void;
  /** Return true if the key was handled. */
  onKeyDown?(event: KeyboardEvent): boolean;
}

export type RendererFactory = (ctx: RendererContext) => Renderer | Promise<Renderer>;
