/**
 * Lazy loading of the third-party libraries used by the renderers.
 *
 * Nothing is downloaded until a file of that type is opened. Resolution order
 * for every library:
 *   1. `libs.modules[name]` - a module object or a loader function you pass in
 *   2. a global variable (`window.pdfjsLib`, `window.mammoth`, `window.XLSX`,
 *      `window.Handsontable`, `window.PPTXjs`) - e.g. from your own <script> tag
 *   3. ESM/CJS builds: a dynamic `import()` of the npm package (your bundler
 *      splits it into its own chunk)
 *      UMD build: the script/module URL in `libs.urls[name]` (defaults to a
 *      version-pinned jsDelivr / SheetJS CDN URL)
 */
import { OfficeError } from "../errors";
import { LIB_VERSIONS } from "./versions";

export type LibName = "pdfjs" | "pdfjsViewer" | "mammoth" | "xlsx" | "handsontable" | "pptxjs";

/** A module object, or a function returning one (sync or async). */
export type LibValue = unknown;

export interface LibraryOptions {
  /** Modules or loader functions, e.g. `{ mammoth: () => import("mammoth/mammoth.browser.js") }`. */
  modules?: Partial<Record<LibName, LibValue>>;
  /** URLs used by the UMD build when a library is not provided or global. */
  urls?: Partial<Record<LibName, string>>;
  /** Nonce added to injected <script>/<style>/<link> tags (strict CSP). */
  nonce?: string;
}

declare const __OTH_UMD__: boolean;
const IS_UMD = typeof __OTH_UMD__ !== "undefined" && __OTH_UMD__;

const JSDELIVR = "https://cdn.jsdelivr.net/npm";

export const DEFAULT_LIB_URLS: Record<LibName, string> = {
  pdfjs: `${JSDELIVR}/pdfjs-dist@${LIB_VERSIONS.pdfjs}/build/pdf.min.mjs`,
  pdfjsViewer: `${JSDELIVR}/pdfjs-dist@${LIB_VERSIONS.pdfjs}/web/pdf_viewer.mjs`,
  mammoth: `${JSDELIVR}/mammoth@${LIB_VERSIONS.mammoth}/mammoth.browser.min.js`,
  xlsx: `https://cdn.sheetjs.com/xlsx-${LIB_VERSIONS.xlsx}/package/dist/xlsx.full.min.js`,
  handsontable: `${JSDELIVR}/handsontable@${LIB_VERSIONS.handsontable}/dist/handsontable.full.min.js`,
  pptxjs: `${JSDELIVR}/@meshesha/pptxjs@${LIB_VERSIONS.pptxjs}/dist/pptxjs.umd.js`,
};

/** Default base URL of the PDF.js worker, CMaps, standard fonts and viewer CSS. */
export const DEFAULT_PDF_ASSETS = `${JSDELIVR}/pdfjs-dist@${LIB_VERSIONS.pdfjs}/`;

const GLOBALS: Record<LibName, string> = {
  pdfjs: "pdfjsLib",
  pdfjsViewer: "pdfjsViewer",
  mammoth: "mammoth",
  xlsx: "XLSX",
  handsontable: "Handsontable",
  pptxjs: "PPTXjs",
};

/** Libraries shipped as ES modules (loaded with `import()`), the rest are classic scripts. */
const ESM_LIBS: LibName[] = ["pdfjs", "pdfjsViewer"];

/** ESM/CJS builds: bundler-visible dynamic imports. Removed from the UMD build. */
function importPackage(name: LibName): Promise<unknown> {
  if (IS_UMD) return Promise.reject(new Error("not available in the UMD build"));
  switch (name) {
    case "pdfjs":
      return import("pdfjs-dist");
    case "pdfjsViewer":
      return import("pdfjs-dist/web/pdf_viewer.mjs");
    case "mammoth":
      return import("mammoth/mammoth.browser.js");
    case "xlsx":
      return import("xlsx");
    case "handsontable":
      return import("handsontable");
    case "pptxjs":
      return import("@meshesha/pptxjs");
  }
}

const scriptCache = new Map<string, Promise<void>>();

/** Loads a classic script once. */
export function loadScript(url: string, nonce?: string): Promise<void> {
  let p = scriptCache.get(url);
  if (p) return p;
  p = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.crossOrigin = "anonymous";
    if (nonce) s.nonce = nonce;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptCache.delete(url);
      s.remove();
      reject(new Error(`Failed to load script ${url}`));
    };
    document.head.appendChild(s);
  });
  scriptCache.set(url, p);
  return p;
}

const linkCache = new Map<string, Promise<void>>();

/** Adds a stylesheet <link> once (resolves when loaded or failed). */
export function loadStylesheet(url: string, nonce?: string, root: Document | ShadowRoot = document): Promise<void> {
  const key = url + "|" + (root === document ? "doc" : "shadow");
  if (root === document) {
    const cached = linkCache.get(key);
    if (cached) return cached;
  }
  const p = new Promise<void>((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.crossOrigin = "anonymous";
    if (nonce) link.nonce = nonce;
    link.onload = () => resolve();
    link.onerror = () => {
      console.warn(`[officetohtml] stylesheet ${url} could not be loaded`);
      resolve();
    };
    (root === document ? document.head : root).appendChild(link);
  });
  if (root === document) linkCache.set(key, p);
  return p;
}

function interop(mod: any): any {
  // CJS modules imported through import() expose module.exports as `default`.
  if (mod && typeof mod === "object" && "default" in mod && Object.keys(mod).length <= 2 && mod.default) {
    return mod.default;
  }
  return mod;
}

const resolved = new Map<string, Promise<any>>();

/** Resolves a third-party library (see the module comment for the order). */
export async function loadLibrary<T = any>(name: LibName, options: LibraryOptions = {}): Promise<T> {
  const provided = options.modules?.[name];
  if (provided !== undefined && provided !== null) {
    try {
      const value = typeof provided === "function" && !isClassLike(name, provided) ? await (provided as () => unknown)() : provided;
      return interop(value) as T;
    } catch (err) {
      throw new OfficeError("LIBRARY_LOAD_ERROR", `Could not load "${name}": ${(err as Error)?.message ?? err}`, err);
    }
  }

  const g = globalThis as any;
  const globalName = GLOBALS[name];
  if (g[globalName]) return g[globalName] as T;

  const url = options.urls?.[name] ?? DEFAULT_LIB_URLS[name];
  const cacheKey = IS_UMD ? `${name}|${url}` : name;
  let p = resolved.get(cacheKey);
  if (!p) {
    p = (async () => {
      if (!IS_UMD) return interop(await importPackage(name));
      if (ESM_LIBS.includes(name)) {
        return interop(await import(/* @vite-ignore */ url));
      }
      await loadScript(url, options.nonce);
      if (!g[globalName]) throw new Error(`"${globalName}" is not defined after loading ${url}`);
      return g[globalName];
    })();
    resolved.set(cacheKey, p);
    p.catch(() => resolved.delete(cacheKey));
  }
  try {
    return (await p) as T;
  } catch (err) {
    throw new OfficeError("LIBRARY_LOAD_ERROR", `Could not load "${name}": ${(err as Error)?.message ?? err}`, err);
  }
}

/**
 * Handsontable's default export is itself a function (a constructor with
 * static members); do not call it as a loader when it is passed directly.
 */
function isClassLike(name: LibName, value: unknown): boolean {
  const v = value as { version?: unknown; Core?: unknown; plugins?: unknown };
  return name === "handsontable" && (v.version !== undefined || v.Core !== undefined || v.plugins !== undefined);
}
