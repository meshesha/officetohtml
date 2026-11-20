/**
 * Browser bundle entry (`<script src="officetohtml.umd.js">` → `window.OfficeToHtml`).
 * Registers `<office-viewer>` and, when jQuery is present, `$.fn.officeToHtml`.
 * Third-party libraries are loaded on demand (see `libs` option).
 */
import { defineOfficeViewerElement } from "./adapters/element";
import { installJQueryPlugin, fromLegacyOptions } from "./adapters/jquery";

export * from "./index";
export { defineOfficeViewerElement, OfficeViewerElement } from "./adapters/element";
export { installJQueryPlugin, fromLegacyOptions };

defineOfficeViewerElement();
const w = typeof window !== "undefined" ? (window as unknown as { jQuery?: { fn?: Record<string, unknown> } }) : undefined;
if (w?.jQuery?.fn && !w.jQuery.fn.officeViewer) installJQueryPlugin(w.jQuery);
