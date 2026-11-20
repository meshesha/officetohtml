# Changelog

## 2.0.0 – 2026-11-20

Complete rewrite in TypeScript. **No jQuery dependency.**

### Added
- `OfficeViewer` class with one Office-like UI for every format: toolbar (open, file name, page
  navigation, zoom, search, print, download, full screen, theme), status bar, empty/loading/error
  states, drag & drop, keyboard shortcuts, password dialog for PDFs.
- Format detection from file content (magic bytes / ZIP structure); explicit `type` and `fileName` overrides.
- New modern image viewer (zoom to cursor, pinch, pan, rotate, flip, fit/100%, transparency grid).
- Text/code/JSON/XML viewer with line numbers, wrapping and search.
- Spreadsheets: sheet tabs, formula bar, merged cells, column widths, hidden rows/columns, RTL sheets,
  workbook active sheet, search, lightweight `"table"` engine without Handsontable.
- PDF: thumbnails and outline sidebar, rotation, hand tool, presentation mode with tap/swipe navigation
  and pinch zoom (PR #16), text-layer option, outline links, password prompt.
- Word: paper-like page view, document image sizes (#12), per-paragraph RTL detection, zoom, search, word count.
- PowerPoint: PPTXjs v2 (list and slideshow modes, autoplay).
- Print only the document (#10), for every format.
- Custom request headers / credentials via `fetchOptions` (#11).
- Translated UI in en, he, ar, es, fr, de, ru, zh; `registerLocale()`, `messages` (#9); RTL UI.
- Light/dark/auto themes with CSS custom properties.
- Adapters: React, Vue 3, Angular (custom element), jQuery (v1-compatible `$.fn.officeToHtml`),
  `<office-viewer>` Web Component.
- Lazy loading of PDF.js, mammoth.js, SheetJS, Handsontable and PPTXjs; `libs` option to pass modules
  or self-hosted URLs; version-pinned CDN defaults for the UMD build.
- Events: `loadstart`, `progress`, `load`, `error`, `warning`, `pagechange`, `zoomchange`,
  `themechange`, `fullscreenchange`, `destroy`.
- Custom renderers (`renderers` option, `OfficeViewer.registerRenderer`).
- Unit, DOM and adapter tests (Vitest + jsdom), CI workflow, rebuilt website.

### Changed
- PDF.js 1.9.426 → 6.5.438, SheetJS 0.10.2 → 0.20.3, Handsontable 2.0.0 → 18.1.2,
  PPTXjs v1 → v2.0.0, mammoth.js → 1.13.0.
- Legacy `.doc`/`.ppt` files show a translated "save as .docx/.pptx" message with a download button (#13).

### Security
- Fixed stored XSS through spreadsheet sheet names and Word hyperlinks; HTML sanitised with DOMPurify;
  updated vulnerable PDF.js (CVE-2024-4367), SheetJS (CVE-2023-30533, CVE-2024-22363) and dropped
  jQuery / jQuery UI. See [docs/security-audit.md](docs/security-audit.md).

### Fixed
- File paths/locale folders no longer required (#1, #15); `moz-chunked-arraybuffer` error (#2);
  PPTX table crash (#7); URLs with query strings; multiple viewers on one page; memory leaks.

### Removed
- jQuery, jQuery UI, reveal.js, d3/nv.d3, jszip-utils and verySimpleImageViewer dependencies.
- The bundled full PDF.js viewer application (replaced by PDF.js viewer components).

## 1.2.1 – 2019-02-15
Last jQuery version (kept in `legacy/v1`).
