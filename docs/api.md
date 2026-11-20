# API reference

The same reference with examples is on https://officetohtml.js.org/pages/docs.html.
All types are exported from `@meshesha/officetohtml` (see `src/types.ts`).

## `new OfficeViewer(container, options?)`

`container` – an element or a CSS selector. The viewer fills it; give it a height or use `options.height`.

### General options

| Option | Type | Default | Description |
|---|---|---|---|
| `theme` | `"light" \| "dark" \| "auto"` | `"auto"` | Colour theme; `auto` follows the OS. |
| `locale` | `string` | `<html lang>` / browser | `en he ar es fr de ru zh` or registered. |
| `messages` | `Partial<Messages>` | – | Override UI strings. |
| `dir` | `"auto" \| "ltr" \| "rtl"` | `"auto"` | UI direction. |
| `height` | `number \| string` | container / 600px | Viewer height. |
| `toolbar` | `boolean \| ToolbarOptions` | `true` | `{ open, fileName, zoom, pages, search, print, download, fullscreen, theme, tools }`. |
| `statusbar` | `boolean` | `true` | Status bar. |
| `formats` | `FileKind[]` | all | Allowed kinds. |
| `maxFileSize` | `number` | 200 MB | `0` = unlimited. |
| `fetchOptions` | `RequestInit` | – | Headers, credentials … for URL sources. |
| `allowedProtocols` | `string[]` | `http: https: blob: data:` | Accepted URL protocols. |
| `dropFiles` | `boolean` | `true` | Drag & drop. |
| `keyboard` | `boolean` | `true` | Keyboard shortcuts. |
| `injectStyles` | `boolean` | `true` | Inject the stylesheet (disable for strict CSP). |
| `nonce` | `string` | – | CSP nonce for injected elements. |
| `libs` | `LibraryOptions` | – | `{ modules?, urls?, nonce? }` – see below. |
| `renderers` | `Record<kind, RendererFactory>` | – | Replace/add renderers. |
| `pdf` `docx` `pptx` `sheet` `image` `text` | objects | – | Per-format options (below). |

### `pdf`
`assetsBase`, `workerSrc`, `workerPort`, `viewerCss`, `zoom` (`number | "auto" | "page-fit" | "page-width" | "page-actual"`),
`page`, `textLayer`, `annotations`, `sidebar`, `pinchZoom`, `swipeNavigation`, `maxCanvasPixels`, `documentOptions`.

### `docx`
`pageView`, `zoom`, `rtl` (`"auto" | boolean`), `imageSizes`, `styleMap`, `includeEmbeddedStyleMap`,
`includeDefaultStyleMap`, `ignoreEmptyParagraphs`, `convertImage`, `allowInlineStyles`, `onMessages`.

### `pptx`
`mode` (`"list" | "slideshow"`), `scale` (`"fit" | "contain" | number`), `viewerOptions` (PPTXjs v2 `ViewerOptions`).

### `sheet`
`engine` (`"handsontable" | "table"`), `licenseKey`, `readOnly`, `rowHeaders`, `colHeaders`, `formulaBar`,
`columnSorting`, `contextMenu`, `fixedRowsTop`, `fixedColumnsStart`, `activeSheet`, `skipHiddenSheets`,
`maxRows`, `language`, `handsontableSettings`, `readOptions`.

### `image`
`zoom`, `maxZoom`, `zoomStep`, `wheelZoom`, `checkerboard`, `background`.

### `text`
`wrap`, `lineNumbers`, `formatJson`, `maxLength`, `zoom`.

## Methods and properties

| Member | Returns | Description |
|---|---|---|
| `load(source, { fileName?, type?, signal? })` | `Promise<LoadResult>` | Load a URL, `File`, `Blob`, `ArrayBuffer` or typed array. |
| `open()` | `void` | File picker. |
| `bindInput(input)` | `() => void` | Load files from an `<input type="file">` (element, id or selector). |
| `close()` | `void` | Close the document. |
| `zoomIn()` / `zoomOut()` / `setZoom(z)` | `void` | Zoom. |
| `zoom` | `number \| null` | Current zoom factor. |
| `goToPage(n)` / `nextPage()` / `previousPage()` | `void` | Pages, slides or sheets. |
| `page` / `pageCount` | `number` | 1-based. |
| `search(q, { matchCase? })` | `Promise<SearchState \| null>` | `{ query, total, current }`. |
| `print()` | `Promise<void>` | Print the document only. |
| `download()` | `void` | Save the original file. |
| `getText()` | `Promise<string>` | Plain text. |
| `toggleFullscreen(force?)` / `isFullscreen` | | Full screen. |
| `setTheme(theme)` / `theme` / `isDark` / `isRtl` | | Theme and direction. |
| `resize()` | `void` | Re-measure. |
| `on(event, fn)` / `once` / `off` | `Unsubscribe` | Events. |
| `file` | `LoadedFile \| null` | `{ bytes, name, mime, ext, kind, format?, size, url? }`. |
| `renderer` | `Renderer \| null` | Active renderer. |
| `element` | `HTMLElement` | Root element (`.oth`). |
| `options` | `OfficeViewerOptions` | Options passed in. |
| `destroy()` | `void` | Clean up everything. |
| `OfficeViewer.registerRenderer(kind, factory)` | static | Global renderer. |

## Events

| Event | Payload |
|---|---|
| `loadstart` | `{ source }` |
| `progress` | `{ phase: "download" \| "render", loaded, total, ratio }` (`ratio` −1 if unknown) |
| `load` | `{ file, renderer }` |
| `error` | `{ error: OfficeError }` |
| `warning` | `{ message, detail? }` |
| `pagechange` | `{ page, total }` |
| `zoomchange` | `{ zoom }` |
| `themechange` | `{ theme, dark }` |
| `fullscreenchange` | `{ fullscreen }` |
| `destroy` | `{}` |

## `OfficeError`

`error.code`: `SOURCE_ERROR`, `INVALID_URL`, `FILE_TOO_LARGE`, `UNSUPPORTED_FORMAT`, `FORMAT_DISABLED`,
`LIBRARY_LOAD_ERROR`, `PARSE_ERROR`, `PASSWORD_REQUIRED`, `ABORTED`, `DESTROYED`. `error.cause` holds the original error.

## Other exports

| Export | Description |
|---|---|
| `renderOffice(container, source, options)` | Create + load in one call. |
| `detectFormat({ bytes?, name?, mime?, type? })` | `{ kind, ext, format? }`. |
| `readSource(source, options)` | `{ bytes, name, mime, url? }`. |
| `registerLocale(code, messages)`, `resolveMessages(code)`, `locales` | i18n. |
| `loadLibrary(name, libs)`, `DEFAULT_LIB_URLS`, `DEFAULT_PDF_ASSETS` | Library loading. |
| `sanitizeHtml(html)`, `isSafeHref(url)` | The sanitizer used for documents. |
| `TextSearch`, `printDocument(job)` | Helpers for custom renderers. |
| `VIEWER_CSS`, `VERSION`, `LIB_VERSIONS` | Constants. |

## `libs` – library resolution

For each of `pdfjs`, `pdfjsViewer`, `mammoth`, `xlsx`, `handsontable`, `pptxjs`:

1. `libs.modules[name]` – a module object or a (async) function returning one;
2. a global (`pdfjsLib`, `mammoth`, `XLSX`, `Handsontable`, `PPTXjs`);
3. ESM/CJS builds: `import()` of the npm package; UMD build: `libs.urls[name]` or `DEFAULT_LIB_URLS[name]`.

## Renderer interface

```ts
type RendererFactory = (ctx: RendererContext) => Renderer | Promise<Renderer>;

interface Renderer {
  render(): Promise<void>;
  destroy(): void;
  getZoom?(): number;  setZoom?(z: number | ZoomPreset): void;  zoomPresets?: ZoomPreset[];
  getPageCount?(): number;  getPage?(): number;  setPage?(n: number): void;  pageLabel?: "page" | "slide" | "sheet";
  search?(q: string, o: { matchCase?: boolean }): SearchState | Promise<SearchState>;
  searchNext?(): …;  searchPrevious?(): …;  clearSearch?(): void;
  print?(): Promise<void>;  getText?(): Promise<string>;
  onThemeChange?(dark: boolean): void;  onResize?(): void;
  onFullscreenChange?(fs: boolean): void;  onKeyDown?(e: KeyboardEvent): boolean;
}
```
