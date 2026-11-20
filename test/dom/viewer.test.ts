// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfficeViewer, OfficeError, type Renderer, type RendererContext } from "../../src/index";
import { enc, makeDocx, para } from "../helpers/fixtures";

let host: HTMLElement;
beforeEach(() => {
  host = document.createElement("div");
  host.style.height = "500px";
  document.body.appendChild(host);
});
afterEach(() => {
  host.remove();
  document.head.querySelectorAll("style[data-oth]").forEach((s) => s.remove());
});

describe("OfficeViewer shell", () => {
  it("renders the empty state, toolbar and injects styles once", () => {
    const v = new OfficeViewer(host, { locale: "en" });
    new OfficeViewer(document.body.appendChild(document.createElement("div")), {});
    expect(host.querySelector(".oth")).not.toBeNull();
    expect(host.querySelector(".oth-toolbar")).not.toBeNull();
    expect(host.textContent).toContain("No document open");
    expect(document.querySelectorAll('style[data-oth="viewer"]').length).toBe(1);
    v.destroy();
    expect(host.querySelector(".oth")).toBeNull();
  });

  it("accepts a selector and fails clearly for a missing element", () => {
    host.id = "viewer-host";
    expect(() => new OfficeViewer("#viewer-host")).not.toThrow();
    expect(() => new OfficeViewer("#missing")).toThrow(/no element/);
  });

  it("respects toolbar options, theme and dir", () => {
    const v = new OfficeViewer(host, { toolbar: { open: false, print: false }, theme: "dark", dir: "rtl" });
    expect(v.element.getAttribute("data-theme")).toBe("dark");
    expect(v.element.getAttribute("dir")).toBe("rtl");
    expect(host.querySelector('[aria-label="Open file"]')).toBeNull();
    v.setTheme("light");
    expect(v.element.getAttribute("data-theme")).toBe("light");
    const none = new OfficeViewer(document.body.appendChild(document.createElement("div")), { toolbar: false, statusbar: false });
    expect(none.element.querySelector(".oth-toolbar")).toBeNull();
    expect((none.element.querySelector(".oth-footer") as HTMLElement).hidden).toBe(true);
  });

  it("uses translated UI strings (issue #9)", () => {
    const v = new OfficeViewer(host, { locale: "he" });
    expect(host.textContent).toContain("אין מסמך פתוח");
    expect(v.element.getAttribute("dir")).toBe("rtl");
  });

  it("only one viewer per container", () => {
    const a = new OfficeViewer(host);
    const destroy = vi.spyOn(a, "destroy");
    new OfficeViewer(host);
    expect(destroy).toHaveBeenCalled();
    expect(host.querySelectorAll(".oth").length).toBe(1);
  });
});

describe("loading", () => {
  it("renders text files as text (no HTML injection)", async () => {
    const v = new OfficeViewer(host);
    const onLoad = vi.fn();
    v.on("load", onLoad);
    const res = await v.load(enc('<img src=x onerror="window.__xss=1">\n<script>window.__xss=2</script>'), { fileName: "evil.html" });
    expect(res.file.kind).toBe("text");
    expect(host.querySelector(".oth-text img, .oth-text script")).toBeNull();
    expect(host.querySelector(".oth-text")!.textContent).toContain("<script>");
    expect((window as any).__xss).toBeUndefined();
    expect(onLoad).toHaveBeenCalledOnce();
    expect(host.querySelector(".oth-file-name")!.textContent).toBe("evil.html");
    expect(v.renderer?.search).toBeTypeOf("function");
    const state = await v.search("script");
    expect(state?.total).toBe(2);
  });

  it("shows a friendly message for legacy .doc files (issue #13)", async () => {
    const v = new OfficeViewer(host, { locale: "en" });
    const onError = vi.fn();
    v.on("error", onError);
    const ole = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0, 0, 0]);
    await expect(v.load(ole, { fileName: "old.doc" })).rejects.toMatchObject({ code: "UNSUPPORTED_FORMAT" });
    expect(onError.mock.calls[0][0].error).toBeInstanceOf(OfficeError);
    expect(host.textContent).toContain("Save the file as .docx");
    expect(host.querySelector('.oth-overlay [aria-label="Download"]')).not.toBeNull();
  });

  it("can restrict formats", async () => {
    const v = new OfficeViewer(host, { formats: ["pdf"] });
    await expect(v.load(enc("hello"), { fileName: "a.txt" })).rejects.toMatchObject({ code: "FORMAT_DISABLED" });
    expect((v.element.querySelector("input[type=file]") as HTMLInputElement).accept).toBe(".pdf");
  });

  it("rejects javascript: URLs", async () => {
    const v = new OfficeViewer(host);
    await expect(v.load("javascript:alert(1)")).rejects.toMatchObject({ code: "INVALID_URL" });
  });

  it("aborts the previous load when a new one starts", async () => {
    let release!: () => void;
    const slow = (): Renderer => ({ render: () => new Promise<void>((r) => (release = r)), destroy() {} });
    // the second load uses a stub too: the real PDF.js can hang under jsdom (seen on Node 22 in CI)
    const fast = (): Renderer => ({ render: async () => {}, destroy() {} });
    const v = new OfficeViewer(host, { renderers: { text: slow, pdf: fast } });
    const first = v.load(enc("one"), { fileName: "1.txt" });
    await new Promise((r) => setTimeout(r, 20));
    const second = v.load(enc("<p>two</p>"), { fileName: "2.json", type: "pdf" });
    release();
    await expect(first).rejects.toMatchObject({ code: "ABORTED" });
    await second.catch(() => undefined);
  });

  it("supports custom renderers and exposes capabilities to the toolbar", async () => {
    let zoom = 1;
    const factory = vi.fn((ctx: RendererContext): Renderer => ({
      async render() {
        ctx.container.appendChild(document.createTextNode("custom!"));
        ctx.setStatus("custom status");
      },
      destroy: vi.fn(),
      getZoom: () => zoom,
      setZoom: (z) => (zoom = typeof z === "number" ? z : 1),
      getPageCount: () => 3,
      getPage: () => 1,
      setPage: vi.fn(),
    }));
    OfficeViewer.registerRenderer("image", factory);
    const v = new OfficeViewer(host);
    await v.load(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2]), { fileName: "a.png" });
    expect(factory).toHaveBeenCalledOnce();
    expect(host.textContent).toContain("custom!");
    expect(host.querySelector(".oth-status")!.textContent).toContain("custom status");
    v.zoomIn();
    expect(zoom).toBe(1.1);
    expect(v.pageCount).toBe(3);
    v.goToPage(9);
    expect(v.renderer!.setPage).toHaveBeenCalledWith(3);
    const r = v.renderer!;
    v.close();
    expect(r.destroy).toHaveBeenCalled();
    OfficeViewer.registerRenderer("image", undefined as any);
  });

  it("binds a file input (v1 inputObjId)", async () => {
    const input = document.body.appendChild(document.createElement("input"));
    input.type = "file";
    input.id = "pick";
    const v = new OfficeViewer(host);
    const load = vi.spyOn(v, "load").mockResolvedValue(undefined as any);
    v.bindInput("pick");
    const file = new File(["hi"], "a.txt");
    Object.defineProperty(input, "files", { value: [file] });
    input.dispatchEvent(new Event("change"));
    expect(load).toHaveBeenCalledWith(file);
  });

  it("throws after destroy", async () => {
    const v = new OfficeViewer(host);
    v.destroy();
    await expect(v.load(enc("x"))).rejects.toMatchObject({ code: "DESTROYED" });
  });
});

describe("docx rendering (mammoth)", () => {
  it("removes javascript: hyperlinks from documents", async () => {
    const rels = `<Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="javascript:alert(document.domain)" TargetMode="External"/>` +
      `<Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.com/" TargetMode="External"/>`;
    const body =
      para("Hello &lt;b&gt;world&lt;/b&gt;") +
      `<w:p><w:hyperlink r:id="rId5"><w:r><w:t>click me</w:t></w:r></w:hyperlink></w:p>` +
      `<w:p><w:hyperlink r:id="rId6"><w:r><w:t>safe</w:t></w:r></w:hyperlink></w:p>` +
      para("שלום עולם");
    const v = new OfficeViewer(host);
    const res = await v.load(makeDocx(body, rels), { fileName: "x.docx" });
    expect(res.file.kind).toBe("docx");
    const page = host.querySelector(".oth-docx-page")!;
    expect(page.textContent).toContain("Hello <b>world</b>");
    expect(page.querySelector("b")).toBeNull();
    const links = [...page.querySelectorAll("a")];
    expect(links.find((a) => a.textContent === "click me")!.hasAttribute("href")).toBe(false);
    expect(links.find((a) => a.textContent === "safe")!.getAttribute("rel")).toContain("noopener");
    expect(page.querySelectorAll('p[dir="auto"]').length).toBeGreaterThan(0);
    expect(await v.getText()).toContain("שלום");
  });

  it("reports damaged files", async () => {
    const v = new OfficeViewer(host);
    const bad = makeDocx(para("x"));
    bad[bad.length - 30] ^= 0xff;
    await expect(v.load(bad.slice(0, 200), { fileName: "broken.docx", type: "docx" })).rejects.toBeInstanceOf(OfficeError);
    expect(host.querySelector(".oth-overlay[role=alert]")).not.toBeNull();
  });
});
