/**
 * `<office-viewer>` custom element (Web Component). Works in plain HTML and in
 * every framework that supports custom elements (Angular, Vue, Svelte, Lit ...).
 *
 * ```html
 * <office-viewer src="/files/report.docx" theme="auto" style="height:600px"></office-viewer>
 * <script type="module">
 *   import { defineOfficeViewerElement } from "@meshesha/officetohtml/element";
 *   defineOfficeViewerElement();
 * </script>
 * ```
 *
 * Attributes: src, file-name, type, theme, locale, dir, toolbar ("false" hides it),
 * statusbar ("false"), height.
 * Properties: `options` (full {@link OfficeViewerOptions}), `viewer` (the instance),
 * `source` (File/Blob/ArrayBuffer).
 * Events (bubbling CustomEvents): `office-load`, `office-error`, `office-pagechange`.
 */
import { OfficeViewer } from "../core/viewer";
import type { OfficeSource } from "../core/source";
import type { OfficeViewerOptions } from "../types";

const Base: typeof HTMLElement = typeof HTMLElement !== "undefined" ? HTMLElement : (class {} as unknown as typeof HTMLElement);

export class OfficeViewerElement extends Base {
  static get observedAttributes(): string[] {
    return ["src", "theme", "locale", "dir", "toolbar", "statusbar", "type", "file-name", "height"];
  }

  private _viewer: OfficeViewer | null = null;
  private _options: OfficeViewerOptions = {};
  private _source: OfficeSource | null = null;
  private _connected = false;

  /** The underlying viewer (null until connected). */
  get viewer(): OfficeViewer | null {
    return this._viewer;
  }

  /** Full options object; setting it re-creates the viewer. */
  get options(): OfficeViewerOptions {
    return this._options;
  }

  set options(value: OfficeViewerOptions) {
    this._options = value ?? {};
    if (this._connected) this.rebuild();
  }

  /** A File/Blob/ArrayBuffer source (alternative to the src attribute). */
  get source(): OfficeSource | null {
    return this._source;
  }

  set source(value: OfficeSource | null) {
    this._source = value;
    if (this._connected) this.loadCurrent();
  }

  connectedCallback(): void {
    this._connected = true;
    if (!this.style.display) this.style.display = "block";
    this.rebuild();
  }

  disconnectedCallback(): void {
    this._connected = false;
    this._viewer?.destroy();
    this._viewer = null;
  }

  attributeChangedCallback(name: string, oldValue: string | null, value: string | null): void {
    if (!this._connected || oldValue === value) return;
    if (name === "src" || name === "type" || name === "file-name") this.loadCurrent();
    else if (name === "theme" && this._viewer && value) this._viewer.setTheme(value as "light" | "dark" | "auto");
    else this.rebuild();
  }

  private collectOptions(): OfficeViewerOptions {
    const o: OfficeViewerOptions = { ...this._options };
    const theme = this.getAttribute("theme");
    if (theme) o.theme = theme as OfficeViewerOptions["theme"];
    const locale = this.getAttribute("locale");
    if (locale) o.locale = locale;
    const dir = this.getAttribute("dir");
    if (dir === "rtl" || dir === "ltr" || dir === "auto") o.dir = dir;
    if (this.getAttribute("toolbar") === "false") o.toolbar = false;
    if (this.getAttribute("statusbar") === "false") o.statusbar = false;
    const height = this.getAttribute("height");
    if (height) o.height = /^\d+$/.test(height) ? Number(height) : height;
    else if (o.height === undefined) o.height = "100%";
    return o;
  }

  private rebuild(): void {
    this._viewer?.destroy();
    const viewer = new OfficeViewer(this, this.collectOptions());
    this._viewer = viewer;
    viewer.on("load", (detail) => this.dispatchEvent(new CustomEvent("office-load", { detail, bubbles: true })));
    viewer.on("error", (detail) => this.dispatchEvent(new CustomEvent("office-error", { detail, bubbles: true })));
    viewer.on("pagechange", (detail) => this.dispatchEvent(new CustomEvent("office-pagechange", { detail, bubbles: true })));
    this.loadCurrent();
  }

  private loadCurrent(): void {
    const src = this._source ?? this.getAttribute("src");
    if (!this._viewer || !src) return;
    this._viewer
      .load(src, { fileName: this.getAttribute("file-name") ?? undefined, type: this.getAttribute("type") ?? undefined })
      .catch(() => undefined /* reported through office-error */);
  }
}

/** Registers `<office-viewer>` (or a custom tag name). Safe to call more than once. */
export function defineOfficeViewerElement(tagName = "office-viewer"): void {
  if (typeof customElements === "undefined") return;
  if (!customElements.get(tagName)) customElements.define(tagName, class extends OfficeViewerElement {});
}

declare global {
  interface HTMLElementTagNameMap {
    "office-viewer": OfficeViewerElement;
  }
}
