# OfficeToHtml

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)
[![npm](https://img.shields.io/npm/v/@meshesha/officetohtml.svg)](https://www.npmjs.com/package/@meshesha/officetohtml)

**View Word, PowerPoint, Excel, PDF, image and text files in the browser – with one Office-like viewer, no server and no jQuery.**

```ts
import { OfficeViewer } from "@meshesha/officetohtml";

const viewer = new OfficeViewer("#viewer", { theme: "auto" });
await viewer.load("report.docx"); // URL, File, Blob, ArrayBuffer or Uint8Array
```

**[Live demo](https://officetohtml.js.org/pages/demos.html)** · **[Documentation](https://officetohtml.js.org/pages/docs.html)** · [Changelog](CHANGELOG.md) · [Migrating from v1](docs/migration-v1-to-v2.md)

| | |
|---|---|
| **Word** `.docx` | paper-like pages, real image sizes, footnotes, RTL paragraphs, zoom, search, print – [mammoth.js](https://github.com/mwilliamson/mammoth.js) |
| **PowerPoint** `.pptx` | slide list or slideshow, autoplay, keyboard, full screen, charts – [PPTXjs v2](https://github.com/meshesha/PPTXjs) |
| **Spreadsheets** `.xlsx .xls .xlsb .ods .csv .tsv .numbers …` | Excel-like grid, sheet tabs, formula bar, merged cells, widths, hidden rows, search – [SheetJS](https://sheetjs.com/) + [Handsontable](https://handsontable.com/) (or a built-in table) |
| **PDF** | selectable text, search, thumbnails, outline, rotation, hand tool, presentation mode with swipe & pinch zoom, password dialog – [PDF.js](https://mozilla.github.io/pdf.js/) |
| **Images** `.png .jpg .gif .webp .avif .svg .bmp .ico` | zoom to cursor, pinch, pan, rotate, flip, fit / 100%, transparency grid |
| **Text** `.txt .md .json .xml` and source code | line numbers, wrapping, JSON pretty-print, search |
| **Everywhere** | toolbar, status bar, light/dark theme, full screen, print *only the document*, download, drag & drop, keyboard shortcuts, 8 UI languages with RTL, events, TypeScript types |
| **Frameworks** | vanilla JS · React · Vue 3 · Angular · jQuery (v1-compatible) · `<office-viewer>` Web Component |
| **Security** | sanitised HTML (DOMPurify), no PDF scripts, safe URLs, size limits, CSP-friendly – see [security audit](docs/security-audit.md) |

Format libraries are loaded **only when a file of that type is opened**, so the core stays small (≈ 30 KB gzip).

## Installation

```bash
npm install @meshesha/officetohtml
```

Or without a build step:

```html
<div id="viewer" style="height:600px"></div>
<script src="https://cdn.jsdelivr.net/npm/@meshesha/officetohtml@2/dist/officetohtml.umd.js"></script>
<script>
  const viewer = new OfficeToHtml.OfficeViewer("#viewer");
  viewer.load("files/demo.pptx");
</script>
```

## Usage

### Vanilla JavaScript

```ts
import { OfficeViewer } from "@meshesha/officetohtml";

const viewer = new OfficeViewer(document.getElementById("viewer")!, {
  theme: "auto",                       // "light" | "dark" | "auto"
  locale: "en",                        // en he ar es fr de ru zh
  toolbar: { download: false },        // hide single buttons
  fetchOptions: { headers: { Authorization: "Bearer …" } },
  pdf: { sidebar: true },
  sheet: { engine: "handsontable" },   // or "table"
});

viewer.on("load", ({ file }) => console.log(file.kind, file.name));
viewer.on("error", ({ error }) => console.error(error.code, error.message));

await viewer.load("/files/budget.xlsx");
viewer.bindInput("#file-input");      // load files chosen in an <input type="file">
```

### React

```tsx
import { OfficeViewer } from "@meshesha/officetohtml/react";

<OfficeViewer src={file} options={{ theme: "dark" }} style={{ height: 600 }} onLoad={({ file }) => {}} />
```

### Vue 3

```vue
<script setup>
import { OfficeViewer } from "@meshesha/officetohtml/vue";
</script>
<template>
  <OfficeViewer src="/files/report.docx" style="height:600px" @load="onLoad" />
</template>
```

### Angular

```ts
// main.ts
import { defineOfficeViewerElement } from "@meshesha/officetohtml/angular";
defineOfficeViewerElement();
// template (component with schemas: [CUSTOM_ELEMENTS_SCHEMA]):
// <office-viewer [attr.src]="url" theme="auto" style="height:600px"></office-viewer>
```

A standalone Angular component is in [examples/angular](examples/angular/office-viewer.component.ts).

### jQuery (v1 API still works)

```js
$("#resolte-contaniner").officeToHtml({ url: "files/demo.docx" });
$("#viewer").officeViewer({ src: "files/demo.pdf", theme: "dark" }); // v2 options
```

### Web Component

```html
<office-viewer src="files/demo.pdf" theme="auto" style="height:600px"></office-viewer>
```

See the **[documentation](https://officetohtml.js.org/pages/docs.html)** (or [docs/api.md](docs/api.md)) for all options, methods, events, theming, self-hosting the libraries and custom renderers.

## Browser support

Current Chrome, Edge, Firefox and Safari (ES2020, `fetch`, `ResizeObserver`, CSS container queries).
TIFF images display only where the browser can decode them (Safari).

## Limitations

* `.doc`, `.ppt`, `.odt`, `.odp` (legacy/binary formats) are not supported – the viewer asks the user to save the file as `.docx` / `.pptx`.
* Word documents are converted by structure (mammoth.js): headings, lists, tables, images and links are kept, but exact fonts, spacing and page layout are not reproduced.
* **Handsontable** is free for non-commercial use only. Commercial users need a [Handsontable license](https://handsontable.com/pricing) (`sheet.licenseKey`) or the built-in table engine (`sheet.engine: "table"`).

## Documentation

* User guide & API: https://officetohtml.js.org/pages/docs.html · [docs/api.md](docs/api.md)
* Frameworks: [docs/frameworks.md](docs/frameworks.md)
* Developer guide (architecture, building, testing, adding a renderer or language): [docs/developer-guide.md](docs/developer-guide.md)
* Migrating from v1: [docs/migration-v1-to-v2.md](docs/migration-v1-to-v2.md)
* Security audit: [docs/security-audit.md](docs/security-audit.md) · reporting: [SECURITY.md](SECURITY.md)
* GitHub issues review & feature requests: [docs/github-issues-report.md](docs/github-issues-report.md)

## Credits

OfficeToHtml is built on these projects – thank you to their authors and contributors:

| Library | Used for | License |
|---|---|---|
| [PPTXjs](https://github.com/meshesha/PPTXjs) | PowerPoint | MIT |
| [mammoth.js](https://github.com/mwilliamson/mammoth.js) | Word | BSD-2-Clause |
| [SheetJS Community Edition](https://sheetjs.com/) | spreadsheet parsing | Apache-2.0 |
| [Handsontable](https://handsontable.com/) | spreadsheet grid | Handsontable license (free for non-commercial use) |
| [PDF.js](https://mozilla.github.io/pdf.js/) | PDF | Apache-2.0 |
| [DOMPurify](https://github.com/cure53/DOMPurify) | HTML sanitising | Apache-2.0 / MPL-2.0 |
| [fflate](https://github.com/101arrowz/fflate) | ZIP inspection | MIT |

Full notices: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

This project replaces my older project [OfficeJs](https://github.com/meshesha/OfficeJs), so the version numbering does not start at 1.0.0.
The v1 jQuery plugin is kept in [legacy/v1](legacy/v1) for reference.

## License

MIT © [meshesha](https://github.com/meshesha)
