/**
 * Angular integration.
 *
 * Angular libraries need the Angular compiler (ng-packagr) for decorators, so
 * this entry point uses the standard `<office-viewer>` custom element, which
 * Angular supports natively:
 *
 * ```ts
 * // main.ts
 * import { defineOfficeViewerElement } from "@meshesha/officetohtml/angular";
 * defineOfficeViewerElement();
 *
 * // any standalone component
 * @Component({
 *   selector: "app-preview",
 *   standalone: true,
 *   schemas: [CUSTOM_ELEMENTS_SCHEMA],
 *   template: `<office-viewer [attr.src]="url" theme="auto" style="height:600px"
 *                (office-load)="loaded($event)"></office-viewer>`,
 * })
 * export class PreviewComponent { url = "/assets/report.docx"; loaded(e: Event) {} }
 * ```
 *
 * A ready-to-copy standalone Angular component that wraps {@link OfficeViewer}
 * directly is in `examples/angular/office-viewer.component.ts`.
 */
export { defineOfficeViewerElement, OfficeViewerElement } from "./element";
export { OfficeViewer } from "../core/viewer";
export type { OfficeViewerOptions, LoadResult } from "../types";
