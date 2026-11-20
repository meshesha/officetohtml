// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { OfficeViewer } from "../../src/index";
import { sheetToModel } from "../../src/renderers/sheet";
import { readFixture } from "../helpers/fixtures";

let host: HTMLElement;
beforeEach(() => {
  host = document.body.appendChild(document.createElement("div"));
});
afterEach(() => host.remove());

function workbook(): Uint8Array {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Name", "Qty", "Note"],
    ["<img src=x onerror=alert(1)>", 3, "=cmd|' /C calc'!A0"],
    ["Merged", null, null],
  ]);
  ws["!merges"] = [{ s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }];
  ws["!cols"] = [{ wch: 20 }, { wpx: 50, hidden: true }];
  XLSX.utils.book_append_sheet(wb, ws, "<img src=x onerror=alert(1)>");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["second"]]), "Second");
  return new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
}

describe("sheetToModel", () => {
  it("starts at A1 and keeps merges, widths and hidden columns", () => {
    const ws = XLSX.utils.aoa_to_sheet([["a"]], { origin: "B3" } as any);
    ws["!merges"] = [{ s: { r: 2, c: 1 }, e: { r: 3, c: 2 } }];
    ws["!cols"] = [{ wch: 10 }, { hidden: true }];
    const m = sheetToModel(XLSX, ws, "S");
    expect(m.data[2][1]).toBe("a");
    expect(m.data[0]).toEqual(["", ""]);
    expect(m.merges).toEqual([{ row: 2, col: 1, rowspan: 1, colspan: 1 }]);
    expect(m.colWidths[0]).toBe(75);
    expect(m.hiddenCols).toEqual([1]);
  });
});

describe("sheet renderer (table engine)", () => {
  it("inserts sheet names and cells as text, not HTML (v1 XSS)", async () => {
    const v = new OfficeViewer(host, { sheet: { engine: "table" } });
    await v.load(workbook(), { fileName: "evil.xlsx" });
    expect(host.querySelector(".oth-tab")!.textContent).toBe("<img src=x onerror=alert(1)>");
    expect(host.querySelector(".oth-sheet img, .oth-footer img")).toBeNull();
    const cells = [...host.querySelectorAll("table.oth-table td")].map((td) => td.textContent);
    expect(cells).toContain("<img src=x onerror=alert(1)>");
    expect(host.querySelector('td[colspan="2"]')).not.toBeNull();
  });

  it("switches sheets with tabs and setPage", async () => {
    const v = new OfficeViewer(host, { sheet: { engine: "table" } });
    await v.load(workbook(), { fileName: "evil.xlsx" });
    expect(v.pageCount).toBe(2);
    (host.querySelectorAll(".oth-tab")[1] as HTMLButtonElement).click();
    expect(v.page).toBe(2);
    expect(host.querySelector("table.oth-table td")!.textContent).toBe("second");
    v.goToPage(1);
    expect(host.querySelector(".oth-tab")!.getAttribute("aria-selected")).toBe("true");
  });

  it("searches cells", async () => {
    const v = new OfficeViewer(host, { sheet: { engine: "table" } });
    await v.load(workbook(), { fileName: "evil.xlsx" });
    const s = await v.search("merged");
    expect(s).toMatchObject({ total: 1, current: 0 });
    expect(host.querySelector("td.oth-selected")!.textContent).toBe("Merged");
  });

  it("reads CSV as UTF-8 (Hebrew and quoted commas)", async () => {
    const v = new OfficeViewer(host, { sheet: { engine: "table" } });
    await v.load(readFixture("demo.csv"), { fileName: "demo.csv" });
    const text = host.querySelector("table.oth-table")!.textContent!;
    expect(text).toContain("מקלדת עברית");
    expect(text).toContain("Mouse, wireless");
  });

  it("reads the real demo workbook", async () => {
    const v = new OfficeViewer(host, { sheet: { engine: "table" } });
    const res = await v.load(readFixture("demo.xlsx"), { fileName: "demo.xlsx" });
    expect(res.file.kind).toBe("sheet");
    expect(host.querySelectorAll("table.oth-table tr").length).toBeGreaterThan(5);
    expect(await v.getText()).toContain("Subject");
  });
});
