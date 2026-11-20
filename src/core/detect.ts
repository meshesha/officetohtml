import { isZip, listZipEntries, readZipText } from "./zip";

/** The renderer families of OfficeToHtml. */
export type FileKind = "pdf" | "docx" | "pptx" | "sheet" | "image" | "text" | "unsupported";

export interface DetectInput {
  bytes?: Uint8Array;
  name?: string;
  mime?: string;
  /** Explicit kind or extension (e.g. "pdf", "xlsx", "sheet"). Wins over everything else. */
  type?: string;
}

export interface DetectResult {
  kind: FileKind;
  /** Lower-case extension without dot ("" if unknown). */
  ext: string;
  /** For unsupported files: the legacy/unknown format, e.g. "doc", "ppt", "odt". */
  format?: string;
}

export const EXTENSIONS: Record<Exclude<FileKind, "unsupported">, string[]> = {
  pdf: ["pdf"],
  docx: ["docx", "docm", "dotx", "dotm"],
  pptx: ["pptx", "pptm", "ppsx", "ppsm", "potx", "potm"],
  sheet: ["xlsx", "xlsm", "xlsb", "xls", "xltx", "xltm", "xlw", "ods", "fods", "csv", "tsv", "dbf", "dif", "slk", "sylk", "prn", "numbers", "et"],
  image: ["png", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "gif", "bmp", "webp", "avif", "svg", "ico", "cur", "apng", "tif", "tiff"],
  text: [
    "txt", "text", "log", "md", "markdown", "json", "jsonc", "xml", "yaml", "yml", "ini", "cfg", "conf", "toml",
    "js", "mjs", "cjs", "ts", "tsx", "jsx", "css", "scss", "less", "html", "htm", "vue", "svelte",
    "py", "rb", "php", "java", "kt", "c", "h", "cpp", "hpp", "cs", "go", "rs", "swift", "sql", "sh", "bat", "ps1", "rtf", "srt", "vtt",
  ],
};

const MIME_KIND: Array<[RegExp, FileKind]> = [
  [/^application\/pdf$/, "pdf"],
  [/wordprocessingml/, "docx"],
  [/presentationml/, "pptx"],
  [/spreadsheetml|ms-excel|opendocument\.spreadsheet|^text\/csv$|tab-separated/, "sheet"],
  [/^image\//, "image"],
  [/^text\/|\/json$|\/xml$|javascript/, "text"],
];

/** Lower-case extension of a file name or URL (query string and hash are ignored). */
export function extensionOf(name: string | undefined): string {
  if (!name) return "";
  const clean = name.split(/[?#]/)[0];
  const base = clean.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  return dot > 0 || (dot === 0 && base.length > 1) ? base.slice(dot + 1).toLowerCase() : "";
}

export function kindFromExtension(ext: string): FileKind | null {
  if (!ext) return null;
  for (const [kind, list] of Object.entries(EXTENSIONS)) if (list.includes(ext)) return kind as FileKind;
  return null;
}

function startsWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (bytes[offset + i] !== sig[i]) return false;
  return true;
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  let s = "";
  for (let i = start; i < Math.min(end, bytes.length); i++) s += String.fromCharCode(bytes[i]);
  return s;
}

/** Image sub-format from magic bytes, or null. */
export function sniffImage(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return "png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpeg";
  if (ascii(bytes, 0, 4) === "GIF8") return "gif";
  if (startsWith(bytes, [0x42, 0x4d]) && bytes.length > 14) return "bmp";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "webp";
  if (ascii(bytes, 4, 8) === "ftyp" && /avif|avis/.test(ascii(bytes, 8, 12))) return "avif";
  if (startsWith(bytes, [0x00, 0x00, 0x01, 0x00]) || startsWith(bytes, [0x00, 0x00, 0x02, 0x00])) return "ico";
  if (startsWith(bytes, [0x49, 0x49, 0x2a, 0x00]) || startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a])) return "tiff";
  const head = ascii(bytes, 0, 512).replace(/^﻿/, "").trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "svg";
  return null;
}

/** Detects the format of OOXML / OpenDocument ZIP packages from their entries. */
export function sniffZip(bytes: Uint8Array): { kind: FileKind; format: string } | null {
  const names = listZipEntries(bytes);
  if (!names.length) return null;
  const has = (prefix: string) => names.some((n) => n.startsWith(prefix));
  if (has("word/")) return { kind: "docx", format: "docx" };
  if (has("ppt/")) return { kind: "pptx", format: "pptx" };
  if (has("xl/")) return { kind: "sheet", format: "xlsx" };
  if (names.includes("mimetype")) {
    const mt = readZipText(bytes, (n) => n === "mimetype", 1024).mimetype?.trim() ?? "";
    if (mt.endsWith("opendocument.spreadsheet")) return { kind: "sheet", format: "ods" };
    if (mt.endsWith("opendocument.text")) return { kind: "unsupported", format: "odt" };
    if (mt.endsWith("opendocument.presentation")) return { kind: "unsupported", format: "odp" };
    if (mt.includes("apple") || mt.includes("numbers")) return { kind: "sheet", format: "numbers" };
  }
  if (names.some((n) => n.startsWith("Index/") && n.endsWith(".iwa"))) return { kind: "sheet", format: "numbers" };
  return null;
}

const OLE_SIG = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

/**
 * Detects which renderer handles a file. Order: explicit `type`, magic bytes,
 * extension, MIME type.
 */
export function detectFormat(input: DetectInput): DetectResult {
  const ext = extensionOf(input.name);

  if (input.type) {
    const t = input.type.toLowerCase().replace(/^\./, "");
    if (["pdf", "docx", "pptx", "sheet", "image", "text", "unsupported"].includes(t)) return { kind: t as FileKind, ext };
    const k = kindFromExtension(t);
    if (k) return { kind: k, ext: t };
    return { kind: "unsupported", ext: t, format: t };
  }

  const bytes = input.bytes;
  if (bytes && bytes.length) {
    if (ascii(bytes, 0, 1024).includes("%PDF-")) return { kind: "pdf", ext };
    const img = sniffImage(bytes);
    if (img) return { kind: "image", ext: ext || img };
    if (isZip(bytes)) {
      const z = sniffZip(bytes);
      if (z) return { kind: z.kind, ext: ext || z.format, format: z.kind === "unsupported" ? z.format : undefined };
    }
    if (startsWith(bytes, OLE_SIG)) {
      // Legacy binary Office (Compound File). SheetJS reads .xls; .doc/.ppt are not supported.
      if (["xls", "xlw", "et"].includes(ext)) return { kind: "sheet", ext };
      if (["doc", "dot", "ppt", "pps", "pot", "msg"].includes(ext)) return { kind: "unsupported", ext, format: ext };
      return { kind: "sheet", ext: ext || "xls" };
    }
    if (ascii(bytes, 0, 5) === "{\\rtf") return { kind: "text", ext: ext || "rtf" };
  }

  if (["doc", "dot", "ppt", "pps", "pot", "odt", "odp", "rtfd", "pages", "key"].includes(ext)) {
    return { kind: "unsupported", ext, format: ext };
  }
  const byExt = kindFromExtension(ext);
  if (byExt) return { kind: byExt, ext };

  if (input.mime) {
    for (const [re, kind] of MIME_KIND) if (re.test(input.mime)) return { kind, ext };
  }

  if (bytes && bytes.length && looksLikeText(bytes)) return { kind: "text", ext };
  return { kind: "unsupported", ext, format: ext || undefined };
}

/** Heuristic: no NUL bytes and mostly printable in the first 4 KB. */
export function looksLikeText(bytes: Uint8Array): boolean {
  if (startsWith(bytes, [0xff, 0xfe]) || startsWith(bytes, [0xfe, 0xff])) return true;
  const n = Math.min(bytes.length, 4096);
  if (!n) return false;
  let bad = 0;
  for (let i = 0; i < n; i++) {
    const b = bytes[i];
    if (b === 0) return false;
    if (b < 9 || (b > 13 && b < 32)) bad++;
  }
  return bad / n < 0.02;
}
