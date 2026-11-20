# GitHub issues review – meshesha/officetohtml

Reviewed: 2026-11-20 – all 16 issues and pull requests (13 open, 3 closed) of
https://github.com/meshesha/officetohtml/issues.

## Bugs and questions – status in v2

| Issue | Title | Type | Status in v2 |
|-------|-------|------|--------------|
| [#1](https://github.com/meshesha/officetohtml/issues/1) | Locale properties and certain files not being found in jQuery with Django | Bug (paths) | **Fixed.** No fixed folder layout: one script file; library and PDF.js asset locations are options (`libs.urls`, `pdf.assetsBase`); the PDF viewer needs no `locale` folder. |
| [#2](https://github.com/meshesha/officetohtml/issues/2) | 'moz-chunked-arraybuffer' error | Bug (old PDF.js) | **Fixed.** PDF.js 1.9 → 6.5; files are read with `fetch()`. |
| [#4](https://github.com/meshesha/officetohtml/issues/4) | pptx with linked video error (closed) | Bug | **Fixed** (PPTXjs v2 handles linked/online media). |
| [#5](https://github.com/meshesha/officetohtml/issues/5) | Numbering restarted from 1 (closed) | mammoth limitation | Still a mammoth.js limitation (list numbering is not reproduced). Documented in the FAQ. |
| [#6](https://github.com/meshesha/officetohtml/issues/6) | Table of content missing dot leaders (closed) | mammoth limitation | mammoth does not output tab leaders. Documented. |
| [#7](https://github.com/meshesha/officetohtml/issues/7) | Error in opening pptx (`slideMasterTextStyles` of undefined in tables) | Bug (PPTXjs v1) | **Fixed** by PPTXjs v2 (rewritten table/text style resolution); errors are now shown in the viewer instead of a blank page. |
| [#9](https://github.com/meshesha/officetohtml/issues/9) | l10n support for unknownMsg | Feature/bug | **Fixed.** All UI strings are translatable (`locale`, `messages`, `registerLocale`); 8 built-in languages. |
| [#10](https://github.com/meshesha/officetohtml/issues/10) | PDF print option prints whole window | Bug | **Fixed.** `print()` prints only the document (all formats) from a hidden iframe. |
| [#11](https://github.com/meshesha/officetohtml/issues/11) | Adding header value to document request | Feature | **Done.** `fetchOptions` (headers, credentials …); also `load(blob)` for full control. |
| [#12](https://github.com/meshesha/officetohtml/issues/12) | HTML formatting not the same as the Word document (image sizes, spacing) | Bug/limitation | **Improved.** Images keep the size set in the document; page-like layout with Word default typography. Exact layout fidelity remains a mammoth.js non-goal (documented). |
| [#13](https://github.com/meshesha/officetohtml/issues/13) | Support for other Office formats (.doc, .ppt, .xls) | Feature | **Partly.** `.xls` (and xlsb, ods, numbers, csv …) supported; `.doc`/`.ppt`/`.odt`/`.odp` show a translated "save as .docx/.pptx" message with a download button. See feature list. |
| [#14](https://github.com/meshesha/officetohtml/issues/14) | Confusing dependencies (closed) | Docs | **Fixed.** One npm package / one script tag; dependencies load automatically. |
| [#15](https://github.com/meshesha/officetohtml/issues/15) | pdf.js not found in Magento 2 (RequireJS) | Bug | **Fixed.** UMD bundle works with AMD loaders; no globals or relative paths required. Documented in the FAQ. |
| [#3](https://github.com/meshesha/officetohtml/issues/3) | Convert .doc/.docx to DOM-like (editable) | Feature | See feature list. |
| [#8](https://github.com/meshesha/officetohtml/issues/8) | Animations within a slide | Feature | See feature list. |
| [#16](https://github.com/meshesha/officetohtml/pull/16) | PR: Add new PDF settings | Pull request | **Implemented in v2** (PR targets v1 code that no longer exists): `pdf.textLayer`, `pdf.pinchZoom`, `pdf.swipeNavigation`, tap left/right navigation in presentation mode. The PR can be closed with a thank-you and a link to v2. |

Suggested replies: for every fixed issue, comment "Fixed in v2.0.0" with the relevant option and
close; keep #3, #8 and #13 open as feature requests (or move them to Discussions).

## Feature requests – for your decision

Collected from the issues (marked with #) and from gaps found while rebuilding the library.
Effort: S < 1 day, M = days, L = weeks.

| # | Feature | Source | Effort | Notes |
|---|---------|--------|--------|-------|
| 1 | **Legacy .doc / .ppt** viewing | #13 | L | No maintained pure-JS reader. Options: a WebAssembly build of LibreOffice (very large), or an optional server-side conversion hook (`convert: (file) => Promise<Blob>`) – recommended, S. |
| 2 | **.odt / .odp** (OpenDocument text/presentation) | #13 | M–L | .odp could be added to PPTXjs v2 (it already *exports* ODP); .odt needs a new converter. |
| 3 | **PPTX animations** (entrance/exit/emphasis, build steps) | #8 | M | Belongs to PPTXjs v2; the viewer would need a "click to advance build" mode. |
| 4 | **Editable documents** (docx → editable DOM, save back) | #3 | L | PPTXjs v2 already has an editor; a docx editor is a separate product. Possible first step: "contenteditable" docx + export to HTML. |
| 5 | **Higher-fidelity Word rendering** (page breaks, headers/footers, numbering, fonts, colours) | #5, #6, #12 | L | Would mean replacing mammoth.js with a layout-preserving renderer such as `docx-preview` (MIT) as an optional engine (`docx.engine: "preview"`). Recommended, M. |
| 6 | Image **gallery** (multiple images / folders, thumbnails strip, slideshow) | new | S–M | `load([files])` with next/previous. |
| 7 | **TIFF / HEIC** images | new | S | Optional decoders (UTIF.js, libheif-js) loaded on demand. |
| 8 | **Annotations & highlights** on PDF (PDF.js editor layer) and saving | new | M | PDF.js ships the editor; needs UI + `getAnnotations()` API. |
| 9 | **Archive browsing** (.zip – list files, open one) | new | S | fflate is already included. |
| 10 | **Markdown rendering** (formatted, sanitised) and **syntax highlighting** for code | new | S | Optional `marked` + DOMPurify, `highlight.js`. |
| 11 | **Email files** (.eml/.msg) | new | M | `.eml` easy; `.msg` needs a CFB parser (SheetJS cfb). |
| 12 | **Spreadsheet styling** (fonts, fills, borders, number formats) and **charts** | new | M | SheetJS CE drops most styles; would need ExcelJS (MIT) as an alternative reader. |
| 13 | **Print options dialog** (page range, slides per page) | #10 | S | |
| 14 | **Server-side rendering / thumbnails** (first page/slide as image in Node) | new | M | PPTXjs v2 already renders without DOM; PDF.js works in Node. |
| 15 | **More UI languages** (pt, it, ja, ko, fa, tr, uk, pl …) | #9 | S each | Contributions welcome. |
| 16 | **Virtualised rendering** for very large docx/pptx | new | M | Today all slides/paragraphs are rendered at once. |
| 17 | **Read-only "embed" mode** (no download/print, watermark) | new | S | Mostly toolbar options + CSS; not real DRM. |
| 18 | **Svelte / Solid / Lit wrappers** | new | S | The Web Component already works there; thin wrappers optional. |

Recommended next steps: **5** (optional high-fidelity docx engine), **1** (conversion hook for
legacy formats), **6** (image gallery) and **15** (community translations).
