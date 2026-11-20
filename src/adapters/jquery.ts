/**
 * jQuery plugin with a v1-compatible API.
 *
 * ```js
 * import $ from "jquery";
 * import { installJQueryPlugin } from "@meshesha/officetohtml/jquery";
 * installJQueryPlugin($);
 *
 * // v1 style (still works)
 * $("#viewer").officeToHtml({ url: "files/demo.docx" });
 * $("#viewer").officeToHtml({ inputObjId: "select_file" });
 *
 * // v2 style
 * $("#viewer").officeViewer({ src: "files/demo.pdf", theme: "dark" });
 * const viewer = $("#viewer").officeViewer(); // the OfficeViewer instance
 * ```
 * With the UMD build the plugin is installed automatically when jQuery is on the page.
 */
import { OfficeViewer } from "../core/viewer";
import type { OfficeViewerOptions } from "../types";

/** Options of officeToHtml v1 (`$.fn.officeToHtml`). Unknown v1 keys are ignored. */
export interface LegacyOptions {
  url?: string;
  inputObjId?: string;
  pdfSetting?: {
    thumbnailViewBtn?: boolean;
    searchBtn?: boolean;
    nextPreviousBtn?: boolean;
    pageNumberTxt?: boolean;
    zoomBtns?: boolean;
    scaleSelector?: boolean;
    presantationModeBtn?: boolean;
    openFileBtn?: boolean;
    printBtn?: boolean;
    downloadBtn?: boolean;
    disableTextLayer?: boolean;
    allowPresentationModeSwipe?: boolean;
    allowPresentationModePinchZoom?: boolean;
    setLang?: string;
    [key: string]: unknown;
  };
  docxSetting?: {
    styleMap?: string | string[] | null;
    includeEmbeddedStyleMap?: boolean;
    includeDefaultStyleMap?: boolean;
    convertImage?: unknown;
    ignoreEmptyParagraphs?: boolean;
    isRtl?: "auto" | boolean;
    [key: string]: unknown;
  };
  pptxSetting?: {
    slidesScale?: string | number;
    slideMode?: boolean;
    [key: string]: unknown;
  };
  sheetSetting?: {
    readOnly?: boolean;
    rowHeaders?: boolean;
    colHeaders?: boolean;
    columnSorting?: boolean;
    contextMenu?: boolean;
    fixedRowsTop?: number;
    fixedColumnsLeft?: number;
    language?: string;
    search?: boolean;
    [key: string]: unknown;
  };
  imageSetting?: Record<string, unknown>;
  /** v2 options may be mixed in. */
  [key: string]: unknown;
}

/** Converts officeToHtml v1 options to v2 {@link OfficeViewerOptions}. */
export function fromLegacyOptions(o: LegacyOptions): OfficeViewerOptions {
  const pdf = o.pdfSetting ?? {};
  const docx = o.docxSetting ?? {};
  const pptx = o.pptxSetting ?? {};
  const sheet = o.sheetSetting ?? {};
  const v2: OfficeViewerOptions = {};
  for (const [k, v] of Object.entries(o)) {
    if (!["url", "inputObjId", "pdfSetting", "docxSetting", "pptxSetting", "sheetSetting", "imageSetting"].includes(k)) (v2 as Record<string, unknown>)[k] = v;
  }
  const toolbar = typeof v2.toolbar === "object" ? { ...v2.toolbar } : {};
  if (pdf.printBtn === false) toolbar.print = false;
  if (pdf.downloadBtn === false) toolbar.download = false;
  if (pdf.openFileBtn === false) toolbar.open = false;
  if (pdf.searchBtn === false) toolbar.search = false;
  if (pdf.zoomBtns === false && pdf.scaleSelector === false) toolbar.zoom = false;
  if (pdf.nextPreviousBtn === false && pdf.pageNumberTxt === false) toolbar.pages = false;
  if (pdf.presantationModeBtn === false) toolbar.fullscreen = false;
  if (Object.keys(toolbar).length && v2.toolbar !== false) v2.toolbar = toolbar;
  if (pdf.setLang && !v2.locale) v2.locale = String(pdf.setLang);

  const slidesScale = pptx.slidesScale !== undefined && pptx.slidesScale !== "" ? parseFloat(String(pptx.slidesScale)) / 100 : undefined;
  return {
    ...v2,
    pdf: {
      textLayer: pdf.disableTextLayer ? false : undefined,
      swipeNavigation: pdf.allowPresentationModeSwipe,
      pinchZoom: pdf.allowPresentationModePinchZoom,
      sidebar: undefined,
      ...(v2.pdf ?? {}),
    },
    docx: {
      styleMap: docx.styleMap ?? undefined,
      includeEmbeddedStyleMap: docx.includeEmbeddedStyleMap,
      includeDefaultStyleMap: docx.includeDefaultStyleMap,
      ignoreEmptyParagraphs: docx.ignoreEmptyParagraphs,
      convertImage: docx.convertImage ?? undefined,
      rtl: docx.isRtl,
      ...(v2.docx ?? {}),
    },
    pptx: {
      mode: pptx.slideMode ? "slideshow" : undefined,
      scale: slidesScale && Number.isFinite(slidesScale) ? slidesScale : undefined,
      ...(v2.pptx ?? {}),
    },
    sheet: {
      readOnly: sheet.readOnly ?? true,
      rowHeaders: sheet.rowHeaders,
      colHeaders: sheet.colHeaders,
      columnSorting: sheet.columnSorting,
      contextMenu: sheet.contextMenu,
      fixedRowsTop: sheet.fixedRowsTop,
      fixedColumnsStart: sheet.fixedColumnsLeft,
      language: sheet.language && sheet.language !== "en-US" ? sheet.language : undefined,
      ...(v2.sheet ?? {}),
    },
  };
}

const DATA_KEY = "officetohtml-viewer";
type JQueryLike = any;

/** Registers `$.fn.officeToHtml` (v1 compatible) and `$.fn.officeViewer`. */
export function installJQueryPlugin($: JQueryLike): void {
  if (!$ || !$.fn) throw new Error("installJQueryPlugin: a jQuery instance is required");

  $.fn.officeToHtml = function (this: JQueryLike, options: LegacyOptions = {}) {
    return this.each(function (this: HTMLElement) {
      ($(this).data(DATA_KEY) as OfficeViewer | undefined)?.destroy();
      const viewer = new OfficeViewer(this, fromLegacyOptions(options));
      $(this).data(DATA_KEY, viewer);
      if (options.url) viewer.load(options.url).catch(() => undefined);
      if (options.inputObjId) viewer.bindInput(options.inputObjId);
    });
  };

  /** `$(el).officeViewer(options)` creates a viewer; `$(el).officeViewer()` returns it. */
  $.fn.officeViewer = function (this: JQueryLike, options?: OfficeViewerOptions & { src?: string | Blob; fileName?: string }) {
    if (options === undefined) return this.first().data(DATA_KEY);
    return this.each(function (this: HTMLElement) {
      ($(this).data(DATA_KEY) as OfficeViewer | undefined)?.destroy();
      const viewer = new OfficeViewer(this, options);
      $(this).data(DATA_KEY, viewer);
      if (options.src) viewer.load(options.src, { fileName: options.fileName }).catch(() => undefined);
    });
  };
}

declare const window: { jQuery?: JQueryLike } | undefined;
if (typeof window !== "undefined" && window && window.jQuery?.fn && !window.jQuery.fn.officeViewer) {
  installJQueryPlugin(window.jQuery);
}

declare global {
  interface JQuery {
    /** officeToHtml v1-compatible plugin. */
    officeToHtml(options?: LegacyOptions): JQuery;
    /** Returns the viewer of the first element. */
    officeViewer(): OfficeViewer | undefined;
    /** Creates a viewer on every matched element. */
    officeViewer(options: OfficeViewerOptions & { src?: string | Blob; fileName?: string }): JQuery;
  }
}
