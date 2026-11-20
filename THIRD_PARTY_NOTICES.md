# Third-party notices

OfficeToHtml (MIT) uses the following open-source software. The browser loads each library only when a
file of the matching type is opened. Versions are those this release was built and tested with
(`src/core/versions.ts`).

| Package | Version | License | Copyright | Links |
|---|---|---|---|---|
| @meshesha/pptxjs (PPTXjs v2) | 2.0.0 | MIT | © meshesha | https://github.com/meshesha/PPTXjs |
| mammoth | 1.13.0 | BSD-2-Clause | © Michael Williamson | https://github.com/mwilliamson/mammoth.js |
| xlsx (SheetJS Community Edition) | 0.20.3 | Apache-2.0 | © SheetJS LLC | https://sheetjs.com/ · https://git.sheetjs.com/sheetjs/sheetjs |
| handsontable | 18.1.2 | Handsontable Software License (free for non-commercial and evaluation use; commercial license required otherwise) | © HANDSONCODE sp. z o.o. | https://handsontable.com/ · https://github.com/handsontable/handsontable |
| pdfjs-dist (PDF.js) | 6.5.438 | Apache-2.0 | © Mozilla Foundation | https://mozilla.github.io/pdf.js/ · https://github.com/mozilla/pdf.js |
| dompurify | 3.4.18 | Apache-2.0 OR MPL-2.0 | © Cure53 and other contributors | https://github.com/cure53/DOMPurify |
| fflate | 0.8.x | MIT | © Arjun Barrett | https://github.com/101arrowz/fflate |

Transitive dependencies of mammoth.js (bundled in `mammoth.browser.js`) include JSZip (MIT/GPLv3 dual),
underscore (MIT), @xmldom/xmldom (MIT), lop (BSD-2-Clause), dingbat-to-unicode (BSD-2-Clause),
base64-js (MIT) and xmlbuilder (MIT).

Development tools (not distributed): TypeScript (Apache-2.0), Vite (MIT), Vitest (MIT), jsdom (MIT),
ESLint (MIT), typescript-eslint (MIT), Playwright (Apache-2.0), React (MIT), Vue (MIT), jQuery (MIT).

## Handsontable license note

Handsontable 7.0 and later is not open source. Using it in a commercial product requires a license from
Handsontable (https://handsontable.com/pricing). OfficeToHtml passes the key
`"non-commercial-and-evaluation"` by default; set `sheet.licenseKey` to your key, or use
`sheet.engine: "table"` to avoid Handsontable entirely.

## Full license texts

The complete license texts are included in each package in `node_modules/<package>/LICENSE*`, and in
the `vendor/<package>/` folders of the website build. Apache-2.0: https://www.apache.org/licenses/LICENSE-2.0 ·
BSD-2-Clause: https://opensource.org/license/bsd-2-clause · MIT: https://opensource.org/license/mit ·
MPL-2.0: https://www.mozilla.org/MPL/2.0/
