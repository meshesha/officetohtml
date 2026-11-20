# Security audit – officeToHtml v1.2.1 → v2.0.0

Date: 2026-11-20. Scope: `officeToHtml.js` v1.2.1 (now in `legacy/v1/`), the libraries it bundled
in `pages/include/`, and the officetohtml.js.org website. Every finding below is fixed in v2 and,
where it can be tested automatically, covered by a regression test.

## Summary

| # | Severity | Finding (v1) | Fix (v2) | Test |
|---|----------|--------------|----------|------|
| 1 | **Critical** | PDF.js **1.9.426** – affected by CVE-2024-4367 (arbitrary JavaScript execution when opening a crafted PDF; fixed in PDF.js 4.2.67) and older font/eval issues. | PDF.js **6.5.438** with `isEvalSupported: false`, no PDF scripting (`enableScripting` not used), XFA disabled. | – (library) |
| 2 | **High** | **Stored XSS through sheet names.** Sheet names were concatenated into HTML: `'<li><a href="#…">' + sheetName + '</a></li>'`. Excel allows `<`, `>` and quotes in sheet names, so a crafted .xlsx ran script on open. | All sheet names, cells and file names are inserted with `textContent`. | `test/dom/sheet.test.ts` |
| 3 | **High** | **XSS through Word hyperlinks.** mammoth.js copies hyperlink targets verbatim; v1 inserted the HTML with `$(el).html(result)`, so `javascript:` links from a crafted .docx executed on click. | Converted HTML goes through DOMPurify with a tag/attribute allow-list and a URL allow-list (`http`, `https`, `mailto`, `tel`, relative, `#`); `data:` URLs only for raster images; external links get `rel="noopener noreferrer"`. | `test/dom/viewer.test.ts`, `test/dom/sanitize.test.ts` |
| 4 | Medium | **DOM clobbering.** Document ids/names (`id="config"`, `name="getElementById"`) were inserted as-is and could override globals of the host page. | Ids are prefixed per document; DOMPurify removes clobbering names. | `test/dom/sanitize.test.ts` |
| 5 | High | **SheetJS 0.10.2** – CVE-2023-30533 (prototype pollution, fixed 0.19.3) and CVE-2024-22363 (ReDoS, fixed 0.20.2). The npm `xlsx` package is frozen at the vulnerable 0.18.5. | SheetJS **0.20.3** from the official SheetJS CDN tarball. | `test/unit/libs.test.ts` (version pin) |
| 6 | Medium | **jQuery 1.12.4** (CVE-2015-9251, CVE-2019-11358, CVE-2020-11022, CVE-2020-11023) and **jQuery UI 1.12.1** (CVE-2021-41182/41183/41184, CVE-2022-31160) on the website and as required plugin dependencies. | No jQuery dependency. The optional jQuery adapter works with any jQuery the host page uses; the website uses none. | – |
| 7 | Medium | **Old JSZip 3.x** (bundled with PPTXjs v1; versions < 3.7.0 have CVE-2021-23413 prototype pollution / path issues) and **Handsontable 2.0.0**. | PPTXjs v2 uses fflate; Handsontable 18.1.2. | – |
| 8 | Medium | **Unrestricted URLs.** Any string was fetched (`javascript:`, `file:`), no size limits (memory exhaustion / zip bombs). | `allowedProtocols` (default `http:`, `https:`, `blob:`, `data:`), `maxFileSize` (default 200 MB, enforced while streaming), PPTXjs v2 zip-bomb limits. | `test/unit/source.test.ts`, `test/dom/viewer.test.ts` |
| 9 | Medium | **SVG images** were shown by the image plugin; when an SVG is inlined its scripts run. | Images (including SVG) are always shown through `<img src="blob:…">`, where scripts never execute. | – |
| 10 | Low | **Implicit globals**: `setLang`, `setLangFilesPath`, `fileBlob` were assigned without `var` (global namespace pollution, clashes with page variables, strict-mode crashes). | TypeScript strict mode, ES modules. | lint/typecheck |
| 11 | Low | **Object URLs never revoked** for files chosen in the input (memory leak on every file). | Object URLs are revoked on `destroy()`/next load; files are read as bytes. | – |
| 12 | Low | **Printing** printed the whole host page (issue #10), possibly including private page content. | Only the document is printed, from a sandboxed iframe (`allow-modals allow-same-origin`, no scripts). | – |
| 13 | Low | **Third-party CDNs** (highlight.js 9.12 from cdnjs on the docs page) without integrity. | The site self-hosts every library (`scripts/build-site.mjs`); the library's own default CDN URLs are version-pinned and can be replaced with `libs.urls`. | – |

## Other bugs fixed while auditing

* `Math.round(Math.floor() * 90000)` always produced `NaN` ids (`doc_file_NaN`).
* The extension was taken with `url.split('.').pop()`, so `file.pdf?token=1` was "unsupported"; v2 detects the format from the file content.
* Fixed element ids (`#outerContainer`, `#wbSheets_search_field`, `#mainPdfWarrper` …) made two viewers on one page break each other; v2 has no global ids.
* `fetch`/XHR errors were not handled – the viewer stayed blank. v2 shows an error state and emits `error`.
* Container `div` content was replaced with `$(…).html("")` but plugin listeners were never removed (leaks when switching files).

## Defensive features in v2

* Content-type sniffing (magic bytes, ZIP structure) instead of trusting the extension.
* `formats` option to restrict which file types may be opened.
* Strict-CSP friendly: `injectStyles: false` + static `officetohtml.css`, `nonce` for anything injected, no `eval`/`new Function`.
* Search queries are matched literally (no regular-expression injection).
* `load()` cancels the previous load; destroyed viewers reject further calls.

## Remaining considerations

* **Handsontable license** – not a vulnerability, but a legal risk: Handsontable ≥ 7 is free only for
  non-commercial use. Commercial users must pass their own `sheet.licenseKey` or use `sheet.engine: "table"`.
* **Default CDN** – the browser (UMD) build loads format libraries from jsDelivr / cdn.sheetjs.com unless
  `libs.urls` is set. Privacy- or supply-chain-sensitive deployments should self-host (documented).
* **mammoth.js inline styles** – disabled by default (`docx.allowInlineStyles`). Even when enabled,
  DOMPurify keeps the CSS but CSS cannot run script in modern browsers.
* `npm audit` reports 0 vulnerabilities for the v2 dependency tree (2026-11-20).
