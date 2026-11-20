import { afterEach, describe, expect, it, vi } from "vitest";
import { fileNameFromContentDisposition, fileNameFromUrl, readSource, resolveUrl } from "../../src/core/source";

afterEach(() => vi.unstubAllGlobals());

describe("resolveUrl", () => {
  it("rejects dangerous protocols", () => {
    expect(() => resolveUrl("javascript:alert(1)")).toThrow(/not allowed/);
    expect(() => resolveUrl(" JAVASCRIPT:alert(1)")).toThrow(/not allowed/);
    expect(() => resolveUrl("file:///etc/passwd")).toThrow(/not allowed/);
    expect(resolveUrl("https://example.com/a.pdf").href).toBe("https://example.com/a.pdf");
    expect(resolveUrl("data:text/plain,hi").protocol).toBe("data:");
  });

  it("supports a custom allow-list", () => {
    expect(() => resolveUrl("http://x/a.pdf", ["https:"])).toThrow();
  });
});

describe("file names", () => {
  it("from URLs", () => {
    expect(fileNameFromUrl("https://x.com/dir/My%20File.docx?sig=1")).toBe("My File.docx");
    expect(fileNameFromUrl("data:text/plain,abc")).toBe("");
  });
  it("from Content-Disposition", () => {
    expect(fileNameFromContentDisposition('attachment; filename="report.pdf"')).toBe("report.pdf");
    expect(fileNameFromContentDisposition("attachment; filename*=UTF-8''%D7%93%D7%95%D7%97.xlsx")).toBe("דוח.xlsx");
    expect(fileNameFromContentDisposition(null)).toBe("");
  });
});

describe("readSource", () => {
  it("reads typed array views and ArrayBuffers", async () => {
    const buf = new Uint8Array([9, 1, 2, 3, 9]);
    expect(Array.from((await readSource(buf.subarray(1, 4))).bytes)).toEqual([1, 2, 3]);
    expect((await readSource(buf.buffer)).bytes.byteLength).toBe(5);
  });

  it("reads Files with name and type", async () => {
    const file = new File([new Uint8Array([1, 2])], "a.png", { type: "image/png" });
    expect(await readSource(file)).toMatchObject({ name: "a.png", mime: "image/png" });
  });

  it("enforces maxFileSize", async () => {
    await expect(readSource(new Uint8Array(10), { maxFileSize: 5 })).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  it("passes fetch options (custom headers, issue #11) and reads the file name", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { "content-disposition": 'inline; filename="x.pdf"', "content-type": "application/pdf; charset=binary" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const r = await readSource("https://example.com/download?id=7", { fetchOptions: { headers: { Authorization: "Bearer t" } } });
    expect(r.name).toBe("x.pdf");
    expect(r.mime).toBe("application/pdf");
    expect((fetchMock.mock.calls[0] as unknown[])[1]).toMatchObject({ headers: { Authorization: "Bearer t" } });
  });

  it("reports HTTP errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 404, statusText: "Not Found" })));
    await expect(readSource("https://example.com/a.pdf")).rejects.toMatchObject({ code: "SOURCE_ERROR" });
  });

  it("stops streaming downloads that exceed the limit", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array(100))));
    await expect(readSource("https://example.com/a.pdf", { maxFileSize: 10 })).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  it("honours an aborted signal", async () => {
    const c = new AbortController();
    c.abort();
    await expect(readSource(new Uint8Array(1), { signal: c.signal })).rejects.toMatchObject({ code: "ABORTED" });
  });
});
