# 3. GitHub issues – what to close and what to reply

Post these replies **after** v2.0.0 is merged, published to npm and live on officetohtml.js.org,
so every link in them works.

If your v2 commit or PR contains `Fixes #1, #2, #7, #9, #10, #11, #15`, GitHub closes those
issues automatically on merge. You still need to post the replies yourself, and the auto-close
always uses the reason "completed".

How to close: open the issue → paste the reply in the comment box → click the arrow next to
**Close with comment** → choose the reason (**Close as completed** or **Close as not planned**).
For the pull request use **Close pull request** (PRs have no close reason).

## Summary

| # | Title | Action | Close reason |
|---|-------|--------|--------------|
| #16 | PR: Add new settings for pdf | **Close PR** | – |
| #15 | pdf.js not found in Magento 2 | **Close** | completed |
| #13 | Support for other Office formats | **Keep open**, add label `enhancement` | – |
| #12 | HTML formatting not the same as the Word document | **Close** | completed (partly) |
| #11 | Adding header value to document request | **Close** | completed |
| #10 | PDF print prints whole window | **Close** | completed |
| #9 | l10n support for unknownMsg | **Close** | completed |
| #8 | Animations within a slide of pptx | **Keep open**, label `enhancement`, or move to PPTXjs | – |
| #7 | Error in opening pptx | **Close** | completed |
| #3 | Convert .doc/.docx to DOM-like (editable) | **Close** | not planned |
| #2 | 'moz-chunked-arraybuffer' error | **Close** | completed |
| #1, #4, #5, #6, #14 | already closed | Optional short "v2" note on #1 and #14 | – |

Suggested labels (create them once under Issues → Labels): `enhancement`, `fixed-in-v2`, `wontfix`.

---

## Replies to paste

### #16 – PR "Add new settings for pdf" → close the PR

> Thank you very much for this PR, and sorry it took so long!
>
> officeToHtml v2 is a complete rewrite (TypeScript, no jQuery, PDF.js 6), so the v1 file this PR
> changes no longer exists. But all of your ideas are now built in:
>
> - disable the text layer: `pdf: { textLayer: false }`
> - pinch zoom: `pdf: { pinchZoom: true }` (on by default)
> - swipe navigation in presentation mode: `pdf: { swipeNavigation: true }` (on by default)
> - tap on the left / right half of the screen to go to the previous / next page in presentation mode
>
> The v1 plugin API still works: `pdfSetting: { disableTextLayer, allowPresentationModeSwipe,
> allowPresentationModePinchZoom }` are mapped to the new options.
>
> Docs: https://officetohtml.js.org/pages/docs.html#opt-pdf · Demo: https://officetohtml.js.org/pages/demos.html
>
> Closing because the code moved on, but your contribution shaped v2. Thanks again! 🙏

### #15 – pdf.js not found in Magento 2 → close (completed)

> This is fixed in **officeToHtml v2.0.0**.
>
> v2 no longer depends on a folder layout or on global `pdf.js` paths. It is a single file
> (`officetohtml.umd.js`, or `npm install @meshesha/officetohtml`) and loads PDF.js by itself when
> a PDF is opened. The UMD bundle also works as an AMD module, so it can be used with RequireJS
> (Magento 2):
>
> ```js
> require(["path/to/officetohtml.umd"], function (OfficeToHtml) {
>   var viewer = new OfficeToHtml.OfficeViewer("#resolte-contaniner");
>   viewer.load(file_path);
> });
> ```
>
> To serve the libraries from your own server, see
> https://officetohtml.js.org/pages/docs.html#libraries. Please reopen if you still have problems
> with v2.

### #13 – Support for other Office formats → keep open, label `enhancement`, comment

> Update for **v2.0.0**:
>
> - **.xls** (old Excel) is now supported, and so are .xlsb, .ods, .numbers, .csv/.tsv and more.
> - **.doc** and **.ppt** (old binary Word/PowerPoint) are still not supported, because there is no
>   reliable browser-side reader for them. v2 now shows a clear, translated message
>   ("Save the file as .docx and open it again") with a download button instead of an error.
>
> To convert files today, use Word/PowerPoint (*Save as* .docx/.pptx) or LibreOffice:
> `soffice --headless --convert-to docx file.doc` (`--convert-to pptx` for .ppt).
>
> I'm keeping this issue open as a feature request. A possible next step is a "conversion hook"
> option so applications can convert legacy files on their server automatically.

### #12 – HTML formatting not the same as the Word document → close (completed, partly)

> **officeToHtml v2.0.0** improves this:
>
> - images now keep the size they have in the document (they no longer appear at full size);
> - the document is shown on a page with Word's default typography, with zoom and printing.
>
> Exact layout (fonts, colours, spacing, page breaks) is still not reproduced. Word files are
> converted by [mammoth.js](https://github.com/mwilliamson/mammoth.js), which deliberately converts
> the *structure* of a document (headings, lists, tables, links, images) into clean HTML. You can
> map Word styles to your own CSS with `docx: { styleMap: [...] }`.
>
> A higher-fidelity Word engine is on the feature list. Closing this one as the image-size part
> is fixed; feel free to comment if you need more.

### #11 – Adding header value to document request → close (completed)

> Added in **officeToHtml v2.0.0** with the `fetchOptions` option, passed directly to `fetch()`:
>
> ```js
> const viewer = new OfficeToHtml.OfficeViewer("#viewer", {
>   fetchOptions: { headers: { Authorization: "Bearer " + token }, credentials: "include" },
> });
> viewer.load("https://example.com/api/file/42");
> ```
>
> For full control you can also download the file yourself and pass a `Blob` or `ArrayBuffer`
> to `viewer.load(blob, { fileName: "report.pptx" })`.
> Docs: https://officetohtml.js.org/pages/docs.html#quick-start

### #10 – PDF print prints whole window → close (completed)

> Fixed in **officeToHtml v2.0.0**. The print button (and Ctrl+P while the viewer has focus) now
> prints **only the document**, not the page around it. This works for every format: PDF, Word,
> PowerPoint, spreadsheets, images and text. You can also call `viewer.print()` from your code.
> Thanks for the screenshots!

### #9 – l10n support for unknownMsg → close (completed)

> Done in **officeToHtml v2.0.0**. Every text of the viewer is now translatable, including the
> "unsupported file" and error messages. Built-in languages: English, Hebrew, Arabic, Spanish,
> French, German, Russian and Chinese (Hebrew and Arabic switch to right-to-left).
>
> ```js
> new OfficeToHtml.OfficeViewer("#viewer", {
>   locale: "fr",
>   messages: { unsupportedTitle: "Aperçu impossible" },   // override any text
> });
> // add a language:
> OfficeToHtml.registerLocale("it", { open: "Apri file", unsupportedTitle: "Anteprima non disponibile" });
> ```
>
> Languages: https://officetohtml.js.org/pages/lang.html. Translations for more languages are very
> welcome as pull requests!

### #8 – Animations within a slide → keep open, label `enhancement`

> Thanks for the request. PowerPoint files are rendered by
> [PPTXjs](https://github.com/meshesha/PPTXjs), which got a complete v2 rewrite (now used by
> officeToHtml v2). Slide transitions and autoplay are supported, but animations *inside* a slide
> (entrance/exit effects, step-by-step builds) are not yet.
>
> I'm keeping this open as a feature request. It will be implemented in PPTXjs first and then
> appear here automatically.

*(Optional: instead, transfer the issue to the PPTXjs repository with "Transfer issue" in the
right-hand sidebar, and close this one.)*

### #7 – Error in opening pptx → close (completed)

> PowerPoint rendering was rewritten in **PPTXjs v2**, which **officeToHtml v2.0.0** now uses. Table
> and text styles are resolved differently, so the `slideMasterTextStyles of undefined` crash in
> tables should be gone. If a file still can't be read, v2 now shows an error message in the
> viewer instead of a blank page.
>
> Please try your presentation in the demo (use the folder button or drag and drop it, the file
> stays on your computer): https://officetohtml.js.org/pages/demos.html. If it still fails, reopen
> this issue and attach the file if possible.

*(I could not test the reporter's own file, which was never shared, so this reply asks them to
confirm.)*

### #3 – Convert .doc/.docx to DOM-like (editable) → close (not planned)

> Thanks for the idea. officeToHtml is a **viewer**: it shows documents but does not edit them.
>
> Some pointers if you need this:
> - the HTML of a converted .docx is in the viewer's container, so you can read it or copy it into
>   your own editor. Or use [mammoth.js](https://github.com/mwilliamson/mammoth.js) directly:
>   `mammoth.convertToHtml({ arrayBuffer })` gives you clean HTML to put into your inputs/textareas;
> - `await viewer.getText()` returns the plain text of any supported document;
> - for presentations, [PPTXjs v2](https://github.com/meshesha/PPTXjs) includes an editor.
>
> A full Word editor is out of scope for this project, so I'm closing this as not planned.

### #2 – 'moz-chunked-arraybuffer' error → close (completed)

> Fixed in **officeToHtml v2.0.0**. The error came from the very old PDF.js version (1.9) bundled
> with v1. v2 uses PDF.js 6.5 and reads files with `fetch()`, so this browser incompatibility no
> longer exists. Thanks for reporting!

### Already closed – optional notes

**#1 (Django paths)**

> Follow-up: **officeToHtml v2.0.0** no longer needs a fixed folder structure or the PDF.js
> `locale` files. It's a single script (or npm package), and library locations can be set with the
> `libs.urls` and `pdf.assetsBase` options:
> https://officetohtml.js.org/pages/docs.html#libraries

**#14 (Confusing dependencies)**

> Follow-up: in **v2.0.0** there's only one dependency to include, either
> `npm install @meshesha/officetohtml` or one `<script>` tag. The format libraries load
> automatically. See https://officetohtml.js.org/pages/docs.html#install

**#4, #5, #6** – no reply needed.

---

## Optional: pinned announcement

After the release, consider a pinned issue or GitHub Discussion titled
**"officeToHtml v2.0.0 released"** linking the demo, docs, the migration guide
(`docs/migration-v1-to-v2.md`) and the changelog, and inviting feedback and translations.
