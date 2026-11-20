# Migrating from officeToHtml v1 to v2

## 1. Replace the includes

v1 needed about 20 files (jQuery, jQuery UI, pdf.js + viewer CSS + locale folder, jszip-utils, mammoth,
PPTXjs + d3 + nv.d3 + reveal.js, SheetJS, Handsontable, verySimpleImageViewer, officeToHtml.js/css).
v2 needs one:

```html
<!-- before -->
<link rel="stylesheet" href="./include/pdf/pdf.viewer.css">
<script src="./include/pdf/pdf.js"></script>
<!-- … 15 more … -->
<script src="./include/officeToHtml/officeToHtml.js"></script>

<!-- after -->
<script src="https://cdn.jsdelivr.net/npm/@meshesha/officetohtml@2/dist/officetohtml.umd.js"></script>
```

Delete the old `include/` folder. To serve everything from your own server instead of CDNs, see
[Libraries & self-hosting](https://officetohtml.js.org/pages/docs.html#libraries).

## 2. Keep your code (jQuery) – or move to the v2 API

If jQuery is on the page, the v1 plugin still exists and accepts the v1 options:

```js
$("#resolte-contaniner").officeToHtml({ url: "files/demo.pdf", pdfSetting: { printBtn: false } });
$("#resolte-contaniner").officeToHtml({ inputObjId: "select_file" });
```

Without jQuery:

```js
const viewer = new OfficeToHtml.OfficeViewer("#resolte-contaniner", { toolbar: { print: false } });
viewer.load("files/demo.pdf");
viewer.bindInput("select_file");
```

## 3. Option mapping

| v1 | v2 |
|---|---|
| `url` | `viewer.load(url)` |
| `inputObjId` | `viewer.bindInput(id)` (or the built-in Open button / drag & drop) |
| `pdfSetting.setLang` | `locale` (whole UI, all formats) |
| `pdfSetting.setLangFilesPath` | not needed |
| `pdfSetting.printBtn / downloadBtn / openFileBtn / searchBtn` | `toolbar: { print, download, open, search }` |
| `pdfSetting.zoomBtns + scaleSelector` | `toolbar.zoom` |
| `pdfSetting.nextPreviousBtn + pageNumberTxt` | `toolbar.pages` |
| `pdfSetting.presantationModeBtn` | `toolbar.fullscreen` |
| `pdfSetting.thumbnailViewBtn / bookmarkBtn` | sidebar button (`pdf.sidebar` to open it initially) |
| `pdfSetting.disableTextLayer` (PR #16) | `pdf.textLayer: false` |
| `pdfSetting.allowPresentationModeSwipe / PinchZoom` (PR #16) | `pdf.swipeNavigation`, `pdf.pinchZoom` |
| `docxSetting.styleMap, includeEmbeddedStyleMap, includeDefaultStyleMap, convertImage, ignoreEmptyParagraphs` | same names under `docx` |
| `docxSetting.isRtl` | `docx.rtl` |
| `docxSetting.idPrefix` | automatic (ids are always prefixed) |
| `pptxSetting.slideMode` | `pptx.mode: "slideshow"` |
| `pptxSetting.slidesScale` | `pptx.scale` (factor) |
| `pptxSetting.slideModeConfig.*` | `pptx.viewerOptions.slideshow` (PPTXjs v2 names: `autoplay`, `loop`, `transition` …) |
| `pptxSetting.jsZipV2`, `mediaProcess` | not needed / `pptx.viewerOptions.mediaProcess` |
| `sheetSetting.jqueryui` | removed – sheet tabs are built in |
| `sheetSetting.readOnly, rowHeaders, colHeaders, columnSorting, contextMenu, fixedRowsTop` | same names under `sheet` |
| `sheetSetting.fixedColumnsLeft` | `sheet.fixedColumnsStart` |
| `sheetSetting.search` | built-in search (Ctrl+F) |
| `sheetSetting.width / height` | the viewer size (`height` option / container) |
| `imageSetting.*` | `image: { zoom, maxZoom, zoomStep, wheelZoom }`; toolbar always available |

## 4. Behaviour changes

* `.doc` / `.ppt` show a translated message with a download button instead of plain text.
* The file type is detected from content; a wrong extension no longer breaks loading.
* Errors are shown in the viewer and emitted as `error` events.
* Print prints only the document.
* Several viewers on one page work independently.
