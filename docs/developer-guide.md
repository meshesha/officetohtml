# Developer guide

How OfficeToHtml v2 is built, how to work on it, and how to extend it.

## Repository layout

```
src/
  index.ts              public API (ESM/CJS entry)
  umd.ts                <script> bundle entry (window.OfficeToHtml)
  types.ts              option, event and renderer types
  errors.ts             OfficeError + codes
  core/
    viewer.ts           OfficeViewer: shell UI, load pipeline, toolbar, search bar, overlays, events
    detect.ts           format detection (magic bytes, ZIP entries, extension, MIME)
    source.ts           reading URL/File/Blob/ArrayBuffer (protocol allow-list, size limit, progress)
    libs.ts             lazy loading of third-party libraries (modules → globals → import()/script URL)
    versions.ts         pinned library versions (CDN URLs); kept in sync by a unit test
    i18n.ts             UI strings for 8 languages, registerLocale
    sanitize.ts         DOMPurify wrapper (allow-lists, URL checks, id prefixing)
    search.ts           in-DOM text search with <mark> highlights
    print.ts            print the document only (sandboxed iframe)
    styles.ts           viewer CSS (injected; also emitted as dist/officetohtml.css)
    icons.ts, dom.ts, zip.ts, emitter.ts
  renderers/            one file per format: pdf, docx, pptx, sheet, image, text
  adapters/             react, vue, angular, jquery, element (Web Component)
test/
  unit/                 Node tests (detection, sources, i18n, libraries, helpers)
  dom/                  jsdom tests (viewer shell, sanitizer, sheets, docx, adapters)
  helpers/              fixtures (builds minimal .docx files in memory)
demo/                   Vite dev playground (npm run dev)
scripts/
  build-site.mjs        copies dist + vendor libraries into officetohtml.js.org
  smoke.mjs, interact.mjs, site-check.mjs   headless-Chrome checks (playwright-core)
officetohtml.js.org/    the website (GitHub Pages)
legacy/v1/              the original jQuery plugin, for reference
examples/               framework examples
```

## Architecture

```
OfficeViewer.load(source)
  ├─ readSource()         → bytes, name, MIME            (core/source.ts)
  ├─ detectFormat()       → kind: pdf|docx|pptx|sheet|image|text|unsupported
  ├─ resolve renderer     → options.renderers / registerRenderer / built-in (lazy import())
  ├─ factory(ctx)         → Renderer
  └─ renderer.render()    → draws into ctx.container, adds toolbar buttons, sets status
```

* **The shell owns the UI chrome**; renderers own only their content. Generic toolbar controls appear
  automatically when the renderer implements the matching *capability*:

  | Capability | Shell UI |
  |---|---|
  | `getZoom` + `setZoom` (+ `zoomPresets`) | zoom out / select / zoom in, Ctrl+wheel/±/0 |
  | `getPageCount` + `getPage` + `setPage` (`pageLabel`) | page navigation, PageUp/PageDown |
  | `search` / `searchNext` / `searchPrevious` / `clearSearch` | search button + bar, Ctrl+F |
  | `print` | print button, Ctrl+P |
  | `getText` | `viewer.getText()` |
  | `onResize`, `onThemeChange`, `onFullscreenChange`, `onKeyDown` | lifecycle hooks |

* The `RendererContext` gives renderers: `container`, `toolbar` (add buttons), `sidebar`, `footer`,
  `file`, `options`, `signal` (aborted when another file is loaded), `t` (translations), `lib()`
  (library loader), `update()`, `setStatus()`, `progress()`, `warn()`, `searchUpdate()`,
  `requestPassword()`, `injectCss()`, `injectStylesheet()`.
* **Loading is cancellable.** Every `load()` increments a token and aborts the previous
  `AbortController`; stale results are destroyed and reported as `ABORTED`.
* **Libraries** are never imported statically. `core/libs.ts` contains the only `import("pdfjs-dist")`
  etc.; in the UMD build (`__OTH_UMD__ = true`) those branches are removed and URLs are loaded instead
  (classic `<script>` for UMD libraries, native `import()` for PDF.js ES modules).
* **Security rules** for contributors:
  * never assign untrusted strings to `innerHTML` – use `h()`/`textContent`, or `sanitizeToFragment()`;
  * URLs from documents must pass `isSafeHref()` (or the sanitizer);
  * images from documents are shown via `blob:`/`data:` raster URLs only, never inline SVG;
  * new code paths that handle file content need a test with a malicious sample.

## Commands

```bash
npm install          # Node >= 18 (Vite 7 prefers 20.19+)
npm run dev          # playground at http://localhost:5180 (uses src/ directly)
npm test             # all tests
npm run test:coverage
npm run typecheck
npm run lint
npm run build        # dist/: ESM + CJS + UMD + types + CSS
npm run build:site   # build + copy into officetohtml.js.org (lib/ and vendor/)
```

Headless browser checks (need a local Chrome; start `npm run dev` first):

```bash
node scripts/smoke.mjs http://localhost:5180/      # opens every sample file, saves screenshots to test/output
node scripts/interact.mjs http://localhost:5180/   # search, zoom, slideshow, sheets, RTL …
node scripts/site-check.mjs http://localhost:PORT/ # the built website (serve officetohtml.js.org)
```

## Build outputs

| File | Use |
|---|---|
| `dist/officetohtml.js` / `.cjs` | ESM / CommonJS entry; renderers are separate chunks |
| `dist/{react,vue,angular,jquery,element}.(c)js` | adapters (`@meshesha/officetohtml/react` …) |
| `dist/officetohtml.umd.js` | `<script>` bundle, `window.OfficeToHtml` (includes DOMPurify + fflate) |
| `dist/officetohtml.css` | static stylesheet for `injectStyles: false` |
| `dist/types/` | TypeScript declarations |

## Adding a renderer

1. Create `src/renderers/<name>.ts` exporting `create<Name>Renderer(ctx): Renderer`.
2. Add the kind and extensions to `EXTENSIONS` (and magic-byte sniffing if possible) in `core/detect.ts`.
3. Register it in `BUILTIN_RENDERERS` in `core/viewer.ts`.
4. If it needs a library, add it to `LibName`, `DEFAULT_LIB_URLS`, `GLOBALS`, `importPackage()` in
   `core/libs.ts`, `LIB_VERSIONS` and `scripts/build-site.mjs`, and mark it external in `vite.config.ts`.
5. Add options to `types.ts`, docs to `officetohtml.js.org/pages/docs.html` and `docs/api.md`, and tests.

Third parties can do the same at runtime with `OfficeViewer.registerRenderer(kind, factory)`.

## Adding a language

Add a `Partial<Messages>` object to `core/i18n.ts` and to `locales`. The i18n test checks that every
key is translated and every `{placeholder}` is kept. Right-to-left languages go in `RTL_LOCALES`.

## Updating third-party libraries

1. `npm install pdfjs-dist@latest …` (SheetJS: `npm install https://cdn.sheetjs.com/xlsx-X.Y.Z/xlsx-X.Y.Z.tgz`).
2. Update `src/core/versions.ts` – `test/unit/libs.test.ts` fails until it matches.
3. `npm test && npm run build && node scripts/smoke.mjs` and check the screenshots.
4. Update `THIRD_PARTY_NOTICES.md` and `CHANGELOG.md`.

## Releasing

1. Bump `version` in `package.json` and `VERSION` in `src/core/versions.ts`; update the changelog.
2. `npm publish` (runs typecheck, tests and build through `prepublishOnly`).
3. Push to `master`; the *Pages* workflow rebuilds officetohtml.js.org.

## Website

`officetohtml.js.org/` is static HTML/CSS/JS (no framework). `lib/` and `vendor/` are generated by
`npm run build:site` and are not committed. GitHub Pages must be set to **Source: GitHub Actions**
(Settings → Pages); `.github/workflows/pages.yml` builds and deploys the folder. With Actions
deployments GitHub ignores the `CNAME` file, so the custom domain `officetohtml.js.org` must also
be set in Settings → Pages → Custom domain.
