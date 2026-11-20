import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_LIB_URLS, loadLibrary } from "../../src/core/libs";
import { LIB_VERSIONS, VERSION } from "../../src/core/versions";

const pkg = JSON.parse(readFileSync(resolve(__dirname, "../../package.json"), "utf8"));
const installed = (name: string) => JSON.parse(readFileSync(resolve(__dirname, "../../node_modules", name, "package.json"), "utf8")).version;

describe("library versions", () => {
  it("LIB_VERSIONS match the installed packages, so CDN URLs stay in sync", () => {
    expect(LIB_VERSIONS.pdfjs).toBe(installed("pdfjs-dist"));
    expect(LIB_VERSIONS.mammoth).toBe(installed("mammoth"));
    expect(LIB_VERSIONS.xlsx).toBe(installed("xlsx"));
    expect(LIB_VERSIONS.handsontable).toBe(installed("handsontable"));
    expect(LIB_VERSIONS.pptxjs).toBe(installed("@meshesha/pptxjs"));
    expect(VERSION).toBe(pkg.version);
  });

  it("default URLs are https and version pinned", () => {
    for (const url of Object.values(DEFAULT_LIB_URLS)) {
      expect(url.startsWith("https://")).toBe(true);
      expect(url).toMatch(/\d+\.\d+\.\d+/);
    }
  });
});

describe("loadLibrary", () => {
  it("uses a provided module object", async () => {
    const fake = { convertToHtml: () => 1 };
    expect(await loadLibrary("mammoth", { modules: { mammoth: fake } })).toBe(fake);
  });

  it("calls a provided loader and unwraps default exports", async () => {
    const fake = { read: () => 1 };
    expect(await loadLibrary("xlsx", { modules: { xlsx: async () => ({ default: fake }) } })).toBe(fake);
  });

  it("does not call a Handsontable constructor passed directly", async () => {
    const Ctor = Object.assign(function Handsontable() {}, { version: "x" });
    expect(await loadLibrary("handsontable", { modules: { handsontable: Ctor } })).toBe(Ctor);
  });

  it("wraps loader failures", async () => {
    await expect(loadLibrary("xlsx", { modules: { xlsx: () => Promise.reject(new Error("boom")) } })).rejects.toMatchObject({ code: "LIBRARY_LOAD_ERROR" });
  });

  it("imports the npm package in the ESM build", async () => {
    const XLSX = await loadLibrary("xlsx");
    expect(typeof XLSX.read).toBe("function");
  });
});
