import { describe, expect, it } from "vitest";
import { createTranslator, en, isRtlLocale, locales, registerLocale, resolveMessages } from "../../src/core/i18n";

describe("i18n", () => {
  it("every built-in locale translates every key (except dimensions)", () => {
    const keys = Object.keys(en).filter((k) => k !== "dimensions");
    for (const [code, pack] of Object.entries(locales)) {
      if (code === "en" || code === "it") continue;
      expect(keys.filter((k) => !(k in pack)), `locale ${code}`).toEqual([]);
    }
  });

  it("keeps the placeholders of every message", () => {
    for (const [code, pack] of Object.entries(locales)) {
      for (const [key, value] of Object.entries(pack)) {
        const want = (en as unknown as Record<string, string>)[key].match(/\{\w+\}/g)?.sort() ?? [];
        const got = String(value).match(/\{\w+\}/g)?.sort() ?? [];
        expect(got, `${code}.${key}`).toEqual(want);
      }
    }
  });

  it("resolves region codes and overrides", () => {
    expect(resolveMessages("he-IL").open).toBe(locales.he.open);
    expect(resolveMessages("xx").open).toBe(en.open);
    expect(resolveMessages("en", { open: "Browse" }).open).toBe("Browse");
  });

  it("interpolates", () => {
    const t = createTranslator(resolveMessages("en"));
    expect(t("pageOf", { total: 7 })).toBe("of 7");
    expect(t("unsupportedLegacy", { ext: "doc", suggest: "docx" })).toContain(".docx");
  });

  it("registerLocale adds languages (issue #9)", () => {
    registerLocale("it", { open: "Apri file" });
    expect(resolveMessages("it-IT").open).toBe("Apri file");
    expect(resolveMessages("it").download).toBe(en.download);
  });

  it("knows RTL locales", () => {
    expect(isRtlLocale("ar-EG")).toBe(true);
    expect(isRtlLocale("he")).toBe(true);
    expect(isRtlLocale("en")).toBe(false);
  });
});
