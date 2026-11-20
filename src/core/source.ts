import { OfficeError } from "../errors";

/** Anything a document can be loaded from. */
export type OfficeSource = string | URL | Blob | File | ArrayBuffer | ArrayBufferView;

export interface ReadSourceOptions {
  /** Extra `fetch()` options for URLs: headers, credentials, mode ... */
  fetchOptions?: RequestInit;
  /** Cancels the download. */
  signal?: AbortSignal;
  /** Maximum size in bytes (default 200 MB). `0` or `Infinity` disables the check. */
  maxFileSize?: number;
  /** Called while downloading. `total` is 0 when the server sends no Content-Length. */
  onProgress?: (loaded: number, total: number) => void;
  /** Protocols accepted for string/URL sources (default http:, https:, blob:, data:). */
  allowedProtocols?: string[];
}

export interface SourceData {
  bytes: Uint8Array;
  /** File name (from File.name, the URL path or the Content-Disposition header). */
  name: string;
  /** MIME type if known. */
  mime: string;
  /** The URL the file was loaded from, if any. */
  url?: string;
}

export const DEFAULT_MAX_FILE_SIZE = 200 * 1024 * 1024;
export const DEFAULT_PROTOCOLS = ["http:", "https:", "blob:", "data:"];

function baseUrl(): string | undefined {
  try {
    if (typeof document !== "undefined" && document.baseURI) return document.baseURI;
    if (typeof location !== "undefined") return location.href;
  } catch {
    /* ignore */
  }
  return undefined;
}

/**
 * Resolves a string/URL source and rejects dangerous protocols such as
 * `javascript:` or `file:`.
 */
export function resolveUrl(src: string | URL, allowed: string[] = DEFAULT_PROTOCOLS): URL {
  let url: URL;
  try {
    url = src instanceof URL ? src : new URL(String(src).trim(), baseUrl());
  } catch (err) {
    throw new OfficeError("INVALID_URL", `Invalid URL: ${String(src)}`, err);
  }
  if (!allowed.includes(url.protocol)) {
    throw new OfficeError("INVALID_URL", `URL protocol "${url.protocol}" is not allowed`);
  }
  return url;
}

/** Last path segment of a URL without query string or hash, decoded. */
export function fileNameFromUrl(url: URL | string): string {
  try {
    const u = typeof url === "string" ? new URL(url, baseUrl()) : url;
    if (u.protocol === "data:" || u.protocol === "blob:") return "";
    const seg = u.pathname.split("/").filter(Boolean).pop() ?? "";
    try {
      return decodeURIComponent(seg);
    } catch {
      return seg;
    }
  } catch {
    const clean = String(url).split(/[?#]/)[0];
    return clean.split(/[\\/]/).pop() ?? "";
  }
}

/** Parses `filename` / `filename*` from a Content-Disposition header. */
export function fileNameFromContentDisposition(header: string | null): string {
  if (!header) return "";
  const star = /filename\*\s*=\s*(?:[\w-]+'[^']*')?("?)([^";]+)\1/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[2]);
    } catch {
      return star[2];
    }
  }
  const plain = /filename\s*=\s*("?)([^";]+)\1/i.exec(header);
  return plain ? plain[2].trim() : "";
}

function checkSize(size: number, max: number): void {
  if (max > 0 && Number.isFinite(max) && size > max) {
    throw new OfficeError("FILE_TOO_LARGE", `File is too large (${size} bytes, limit ${max} bytes)`);
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new OfficeError("ABORTED", "Loading was aborted");
}

async function readResponse(res: Response, opts: ReadSourceOptions, max: number): Promise<Uint8Array> {
  const total = Number(res.headers.get("content-length")) || 0;
  if (total) checkSize(total, max);
  if (!res.body || typeof res.body.getReader !== "function") {
    const buf = new Uint8Array(await res.arrayBuffer());
    checkSize(buf.byteLength, max);
    opts.onProgress?.(buf.byteLength, buf.byteLength);
    return buf;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    throwIfAborted(opts.signal);
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    loaded += value.byteLength;
    try {
      checkSize(loaded, max);
    } catch (err) {
      reader.cancel().catch(() => undefined);
      throw err;
    }
    opts.onProgress?.(loaded, total);
  }
  const out = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/** Reads any {@link OfficeSource} into bytes plus its name and MIME type. */
export async function readSource(source: OfficeSource, opts: ReadSourceOptions = {}): Promise<SourceData> {
  const max = opts.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  throwIfAborted(opts.signal);

  if (source == null) throw new OfficeError("SOURCE_ERROR", "No source given");

  if (typeof source === "string" || source instanceof URL) {
    const url = resolveUrl(source, opts.allowedProtocols ?? DEFAULT_PROTOCOLS);
    let res: Response;
    try {
      res = await fetch(url.href, { ...opts.fetchOptions, signal: opts.signal ?? opts.fetchOptions?.signal });
    } catch (err) {
      if (opts.signal?.aborted) throw new OfficeError("ABORTED", "Loading was aborted", err);
      throw new OfficeError("SOURCE_ERROR", `Could not load ${url.href}: ${(err as Error)?.message ?? err}`, err);
    }
    if (!res.ok && res.status !== 0) {
      throw new OfficeError("SOURCE_ERROR", `Could not load ${url.href}: HTTP ${res.status} ${res.statusText}`.trim());
    }
    const bytes = await readResponse(res, opts, max);
    const name = fileNameFromContentDisposition(res.headers.get("content-disposition")) || fileNameFromUrl(url);
    const mime = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    return { bytes, name, mime, url: url.href };
  }

  if (typeof Blob !== "undefined" && source instanceof Blob) {
    checkSize(source.size, max);
    const bytes = new Uint8Array(await source.arrayBuffer());
    throwIfAborted(opts.signal);
    opts.onProgress?.(bytes.byteLength, bytes.byteLength);
    const name = typeof (source as File).name === "string" ? (source as File).name : "";
    return { bytes, name, mime: (source.type || "").toLowerCase() };
  }

  if (source instanceof ArrayBuffer) {
    checkSize(source.byteLength, max);
    return { bytes: new Uint8Array(source), name: "", mime: "" };
  }

  if (ArrayBuffer.isView(source)) {
    checkSize(source.byteLength, max);
    return { bytes: new Uint8Array(source.buffer, source.byteOffset, source.byteLength), name: "", mime: "" };
  }

  throw new OfficeError("SOURCE_ERROR", "Unsupported source type");
}
