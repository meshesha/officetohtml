/**
 * OfficeToHtml v2 - view Office documents, PDF files and images in the browser.
 *
 * @example
 * ```ts
 * import { OfficeViewer } from "@meshesha/officetohtml";
 * const viewer = new OfficeViewer("#viewer");
 * await viewer.load("/files/report.docx");
 * ```
 */
import { OfficeViewer } from "./core/viewer";
import type { LoadOptions, LoadResult, OfficeViewerOptions } from "./types";
import type { OfficeSource } from "./core/source";

export { OfficeViewer };
export { OfficeError, type OfficeErrorCode } from "./errors";
export { detectFormat, extensionOf, kindFromExtension, EXTENSIONS, type FileKind, type DetectResult, type DetectInput } from "./core/detect";
export { readSource, resolveUrl, type OfficeSource, type SourceData, type ReadSourceOptions } from "./core/source";
export { registerLocale, resolveMessages, locales, type Messages } from "./core/i18n";
export { loadLibrary, DEFAULT_LIB_URLS, DEFAULT_PDF_ASSETS, type LibName, type LibraryOptions } from "./core/libs";
export { sanitizeHtml, isSafeHref } from "./core/sanitize";
export { TextSearch } from "./core/search";
export { printDocument, type PrintJob } from "./core/print";
export { VIEWER_CSS } from "./core/styles";
export { LIB_VERSIONS, VERSION } from "./core/versions";
export type * from "./types";

/**
 * One-call helper: creates a viewer in `container` and loads `source`.
 * Resolves with the viewer once the file is rendered.
 */
export async function renderOffice(
  container: HTMLElement | string,
  source: OfficeSource,
  options: OfficeViewerOptions & LoadOptions = {},
): Promise<OfficeViewer> {
  const viewer = new OfficeViewer(container, options);
  await viewer.load(source, { fileName: options.fileName, type: options.type, signal: options.signal });
  return viewer;
}

export type { LoadResult };
