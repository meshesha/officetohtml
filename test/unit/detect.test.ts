import { describe, expect, it } from "vitest";
import { detectFormat, extensionOf, kindFromExtension, looksLikeText, sniffImage, sniffZip } from "../../src/core/detect";
import { enc, readFixture, zipOf } from "../helpers/fixtures";

describe("extensionOf", () => {
  it("ignores query strings and hashes (v1 bug: file.pdf?x=1)", () => {
    expect(extensionOf("https://x.com/a/report.PDF?token=1#p2")).toBe("pdf");
    expect(extensionOf("files\\demo.docx")).toBe("docx");
    expect(extensionOf("noext")).toBe("");
    expect(extensionOf("")).toBe("");
    expect(extensionOf(".gitignore")).toBe("gitignore");
  });
});

describe("kindFromExtension", () => {
  it("maps known extensions", () => {
    expect(kindFromExtension("xlsm")).toBe("sheet");
    expect(kindFromExtension("ods")).toBe("sheet");
    expect(kindFromExtension("pptx")).toBe("pptx");
    expect(kindFromExtension("webp")).toBe("image");
    expect(kindFromExtension("json")).toBe("text");
    expect(kindFromExtension("doc")).toBeNull();
  });
});

describe("sniffing", () => {
  it("detects images from magic bytes", () => {
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0]))).toBe("png");
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
    expect(sniffImage(enc("GIF89a...."))).toBe("gif");
    expect(sniffImage(enc('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe("svg");
    expect(sniffImage(enc("hello"))).toBeNull();
  });

  it("detects OOXML / ODF packages from their entries", () => {
    expect(sniffZip(zipOf({ "word/document.xml": "<x/>" }))?.kind).toBe("docx");
    expect(sniffZip(zipOf({ "ppt/presentation.xml": "<x/>" }))?.kind).toBe("pptx");
    expect(sniffZip(zipOf({ "xl/workbook.xml": "<x/>" }))?.kind).toBe("sheet");
    expect(sniffZip(zipOf({ mimetype: "application/vnd.oasis.opendocument.spreadsheet" }))).toEqual({ kind: "sheet", format: "ods" });
    expect(sniffZip(zipOf({ mimetype: "application/vnd.oasis.opendocument.text" }))).toEqual({ kind: "unsupported", format: "odt" });
    expect(sniffZip(zipOf({ "random.txt": "x" }))).toBeNull();
  });

  it("text heuristic", () => {
    expect(looksLikeText(enc("a,b,c\n1,2,3\n"))).toBe(true);
    expect(looksLikeText(new Uint8Array([1, 2, 0, 4]))).toBe(false);
  });
});

describe("detectFormat", () => {
  it("prefers content over a missing or wrong extension", () => {
    expect(detectFormat({ name: "report.txt", bytes: enc("%PDF-1.7\n...") }).kind).toBe("pdf");
    expect(detectFormat({ name: "download", bytes: readFixture("demo.docx") }).kind).toBe("docx");
    expect(detectFormat({ name: "x.bin", bytes: readFixture("demo.pptx") }).kind).toBe("pptx");
    expect(detectFormat({ name: "x", bytes: readFixture("demo.xlsx") }).kind).toBe("sheet");
    expect(detectFormat({ name: "photo", bytes: readFixture("demo.jpg") }).kind).toBe("image");
  });

  it("honours an explicit type", () => {
    expect(detectFormat({ name: "a.bin", type: "csv", bytes: enc("1,2") })).toEqual({ kind: "sheet", ext: "csv" });
    expect(detectFormat({ type: "text", bytes: enc("x") }).kind).toBe("text");
  });

  it("reports legacy formats as unsupported (issue #13)", () => {
    const ole = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]);
    expect(detectFormat({ name: "old.doc", bytes: ole })).toEqual({ kind: "unsupported", ext: "doc", format: "doc" });
    expect(detectFormat({ name: "old.ppt", bytes: ole }).kind).toBe("unsupported");
    expect(detectFormat({ name: "old.xls", bytes: ole }).kind).toBe("sheet");
  });

  it("falls back to extension, MIME and text sniffing", () => {
    expect(detectFormat({ name: "a.csv", bytes: enc("a,b") }).kind).toBe("sheet");
    expect(detectFormat({ name: "blob", mime: "application/pdf" }).kind).toBe("pdf");
    expect(detectFormat({ name: "README", bytes: enc("plain text") }).kind).toBe("text");
    expect(detectFormat({ name: "a.xyz", bytes: new Uint8Array([0, 1, 2, 0]) }).kind).toBe("unsupported");
  });
});
