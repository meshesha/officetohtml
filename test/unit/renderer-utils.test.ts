import { describe, expect, it } from "vitest";
import { extractImageSizes } from "../../src/renderers/docx";
import { fitScale, zoomAround } from "../../src/renderers/image";
import { decodeText } from "../../src/renderers/text";
import { fromLegacyOptions } from "../../src/adapters/jquery";

describe("docx image sizes (issue #12)", () => {
  it("reads drawing extents and VML sizes in document order, ignoring mc:Choice", () => {
    const xml =
      `<w:drawing><wp:inline><wp:extent cx="952500" cy="476250"/><a:blip r:embed="rId1"/></wp:inline></w:drawing>` +
      `<w:drawing><wp:extent cx="1" cy="1"/><c:chart/></w:drawing>` +
      `<mc:AlternateContent><mc:Choice><w:drawing><wp:extent cx="9" cy="9"/><a:blip r:embed="rId9"/></w:drawing></mc:Choice>` +
      `<mc:Fallback><w:pict><v:shape style="width:72pt;height:36pt"><v:imagedata r:id="rId2"/></v:shape></w:pict></mc:Fallback></mc:AlternateContent>`;
    expect(extractImageSizes(xml)).toEqual([
      { width: 100, height: 50 },
      { width: 96, height: 48 },
    ]);
  });
});

describe("image viewer math", () => {
  it("fits without upscaling", () => {
    expect(fitScale(100, 100, 1000, 1000, 0)).toBe(1);
    expect(fitScale(2000, 1000, 1032, 1032, 0)).toBeCloseTo(0.5);
    expect(fitScale(2000, 1000, 1032, 1032, 90)).toBeCloseTo(0.5);
    expect(fitScale(1000, 2000, 2032, 1032, 90)).toBeCloseTo(1);
  });
  it("zooms around a point", () => {
    expect(zoomAround(0, 0, 0, 0, 2)).toEqual({ tx: 0, ty: 0 });
    expect(zoomAround(0, 0, 100, 50, 2)).toEqual({ tx: -100, ty: -50 });
  });
});

describe("decodeText", () => {
  it("handles BOMs and falls back to Windows-1252", () => {
    expect(decodeText(new Uint8Array([0xef, 0xbb, 0xbf, 0x61]))).toEqual({ text: "a", encoding: "UTF-8 BOM" });
    expect(decodeText(new Uint8Array([0xff, 0xfe, 0x61, 0x00])).text).toBe("a");
    expect(decodeText(new Uint8Array([0xe9])).text).toBe("é");
  });
});

describe("v1 → v2 options (jQuery adapter)", () => {
  it("maps settings", () => {
    const o = fromLegacyOptions({
      url: "a.pdf",
      pdfSetting: { printBtn: false, disableTextLayer: true, allowPresentationModeSwipe: false, setLang: "he" },
      docxSetting: { isRtl: true, styleMap: "p => h1" },
      pptxSetting: { slideMode: true, slidesScale: "50%" },
      sheetSetting: { fixedColumnsLeft: 2, language: "en-US" },
      theme: "dark",
    });
    expect(o.toolbar).toEqual({ print: false });
    expect(o.locale).toBe("he");
    expect(o.theme).toBe("dark");
    expect(o.pdf).toMatchObject({ textLayer: false, swipeNavigation: false });
    expect(o.docx).toMatchObject({ rtl: true, styleMap: "p => h1" });
    expect(o.pptx).toMatchObject({ mode: "slideshow", scale: 0.5 });
    expect(o.sheet).toMatchObject({ fixedColumnsStart: 2, readOnly: true, language: undefined });
    expect((o as Record<string, unknown>).url).toBeUndefined();
  });
});
