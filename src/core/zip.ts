import { unzipSync, strFromU8 } from "fflate";

/** True when the bytes start with a ZIP local file header. */
export function isZip(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

/**
 * Lists the entry names of a ZIP archive without decompressing anything.
 * Returns an empty array for invalid archives.
 */
export function listZipEntries(bytes: Uint8Array, limit = 5000): string[] {
  const names: string[] = [];
  if (!isZip(bytes)) return names;
  try {
    unzipSync(bytes, {
      filter(file) {
        if (names.length < limit) names.push(file.name);
        return false;
      },
    });
  } catch {
    /* damaged archive: keep what we have */
  }
  return names;
}

/**
 * Reads (decompresses) selected text entries of a ZIP archive.
 * `maxSize` protects against zip bombs (uncompressed size per entry).
 */
export function readZipText(bytes: Uint8Array, wanted: (name: string) => boolean, maxSize = 50 * 1024 * 1024): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const files = unzipSync(bytes, {
      filter: (f) => wanted(f.name) && f.originalSize <= maxSize,
    });
    for (const [name, data] of Object.entries(files)) out[name] = strFromU8(data);
  } catch {
    /* ignore */
  }
  return out;
}
