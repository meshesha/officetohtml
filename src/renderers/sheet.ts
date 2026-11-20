/**
 * Spreadsheet renderer: SheetJS reads xlsx/xlsm/xlsb/xls/ods/fods/csv/tsv/
 * numbers/dbf/dif/slk...; Handsontable shows an Excel-like grid (sheet tabs,
 * formula bar, merged cells, column widths, hidden rows/columns, search).
 *
 * `sheet.engine: "table"` renders a lightweight HTML table instead and needs
 * no Handsontable (and no Handsontable license).
 *
 * Every cell and sheet name is inserted as text (v1 inserted sheet names as
 * HTML, which allowed script injection through a crafted workbook).
 */
import { clear, h } from "../core/dom";
import { printDocument } from "../core/print";
import { OfficeError } from "../errors";
import type { Renderer, RendererContext, SearchState } from "../types";
import { decodeText } from "./text";

const TEXT_FORMATS = ["csv", "tsv", "prn", "dif", "slk", "sylk", "txt", "fods"];

export interface SheetModel {
  name: string;
  /** Formatted cell text, starting at A1. */
  data: string[][];
  /** Cell types ("n", "s", "b", "d", "e") parallel to data. */
  types: string[][];
  merges: Array<{ row: number; col: number; rowspan: number; colspan: number }>;
  colWidths: Array<number | undefined>;
  rowHeights: Array<number | undefined>;
  hiddenRows: number[];
  hiddenCols: number[];
  rtl: boolean;
  ws: any;
}

/** Converts a SheetJS worksheet into a {@link SheetModel}. */
export function sheetToModel(XLSX: any, ws: any, name: string, maxRows = Infinity): SheetModel {
  const model: SheetModel = { name, data: [], types: [], merges: [], colWidths: [], rowHeights: [], hiddenRows: [], hiddenCols: [], rtl: false, ws };
  if (!ws || !ws["!ref"]) return model;
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const lastRow = Math.min(range.e.r, range.s.r + maxRows - 1, 1_048_575);
  const lastCol = Math.min(range.e.c, 16_383);
  for (let r = 0; r <= lastRow; r++) {
    const row: string[] = new Array(lastCol + 1).fill("");
    const types: string[] = new Array(lastCol + 1).fill("");
    if (r >= range.s.r) {
      for (let c = range.s.c; c <= lastCol; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (!cell) continue;
        types[c] = cell.t ?? "";
        if (cell.w !== undefined) row[c] = String(cell.w);
        else if (cell.v !== undefined && cell.v !== null) row[c] = cell.v instanceof Date ? cell.v.toLocaleString() : String(cell.v);
      }
    }
    model.data.push(row);
    model.types.push(types);
  }
  for (const m of ws["!merges"] ?? []) {
    if (m.s.r > lastRow) continue;
    model.merges.push({ row: m.s.r, col: m.s.c, rowspan: Math.min(m.e.r, lastRow) - m.s.r + 1, colspan: Math.min(m.e.c, lastCol) - m.s.c + 1 });
  }
  (ws["!cols"] ?? []).forEach((col: any, i: number) => {
    if (!col) return;
    if (col.hidden) model.hiddenCols.push(i);
    const px = col.wpx ?? (col.wch !== undefined ? Math.round(col.wch * 7 + 5) : col.width !== undefined ? Math.round(col.width * 7) : undefined);
    model.colWidths[i] = px ? Math.max(24, Math.min(px, 800)) : undefined;
  });
  (ws["!rows"] ?? []).forEach((row: any, i: number) => {
    if (!row || i > lastRow) return;
    if (row.hidden) model.hiddenRows.push(i);
    const px = row.hpx ?? (row.hpt !== undefined ? Math.round((row.hpt * 96) / 72) : undefined);
    model.rowHeights[i] = px ? Math.max(18, Math.min(px, 400)) : undefined;
  });
  return model;
}

function cellAddress(r: number, c: number): string {
  let col = "";
  let n = c + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    col = String.fromCharCode(65 + m) + col;
    n = Math.floor((n - 1) / 26);
  }
  return `${col}${r + 1}`;
}

export function createSheetRenderer(ctx: RendererContext): Renderer {
  const opts = ctx.options.sheet ?? {};
  let XLSX: any;
  let wb: any;
  let sheets: Array<{ name: string; index: number }> = [];
  let active = 0;
  let model: SheetModel | null = null;
  let hot: any = null;
  let Handsontable: any = null;
  let engine: "handsontable" | "table" = opts.engine ?? "handsontable";
  let searchHits: Array<{ row: number; col: number }> = [];
  let searchIndex = -1;
  let searchQuery = "";
  let tableSelected: HTMLElement | null = null;
  const tabs: HTMLButtonElement[] = [];
  const maxRows = opts.maxRows ?? 5000;

  const root = h("div", { class: "oth-sheet" });
  const fCell = h("div", { class: "oth-formula-cell oth-input", "aria-label": "Cell" });
  const fValue = h("input", { class: "oth-formula-value oth-input", readonly: true, "aria-label": "Value" });
  const formula = h("div", { class: "oth-formula", hidden: opts.formulaBar === false }, fCell, h("span", { class: "oth-formula-fx" }, "fx"), fValue);
  const grid = h("div", { class: "oth-grid" });
  root.append(formula, grid);
  const tabList = h("div", { role: "tablist", style: "display:flex;min-width:0", "aria-label": ctx.t("sheet") });

  const showCell = (r: number, c: number) => {
    fCell.textContent = cellAddress(r, c);
    const cell = model?.ws?.[XLSX.utils.encode_cell({ r, c })];
    fValue.value = cell ? (cell.f ? `=${cell.f}` : cell.w !== undefined ? String(cell.w) : cell.v !== undefined ? String(cell.v) : "") : "";
  };

  const destroyGrid = () => {
    try {
      hot?.destroy();
    } catch {
      /* ignore */
    }
    hot = null;
    tableSelected = null;
    clear(grid);
  };

  const renderTable = () => {
    const m = model!;
    const wrap = h("div", { class: "oth-grid-table", tabindex: "0" });
    const table = h("table", { class: "oth-table" });
    const thead = h("thead");
    const hr = h("tr", {}, h("th", { scope: "col" }));
    const cols = m.data.reduce((n, r) => Math.max(n, r.length), 0);
    for (let c = 0; c < cols; c++) {
      if (m.hiddenCols.includes(c)) continue;
      const th = h("th", { scope: "col" }, cellAddress(0, c).replace(/\d+$/, ""));
      if (m.colWidths[c]) th.style.minWidth = `${m.colWidths[c]}px`;
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    const tbody = h("tbody");
    const covered = new Set<string>();
    const spans = new Map<string, { rowspan: number; colspan: number }>();
    for (const mg of m.merges) {
      spans.set(`${mg.row},${mg.col}`, mg);
      for (let r = mg.row; r < mg.row + mg.rowspan; r++) for (let c = mg.col; c < mg.col + mg.colspan; c++) if (r !== mg.row || c !== mg.col) covered.add(`${r},${c}`);
    }
    const rows = Math.min(m.data.length, maxRows);
    for (let r = 0; r < rows; r++) {
      if (m.hiddenRows.includes(r)) continue;
      const tr = h("tr", {}, h("th", { scope: "row" }, String(r + 1)));
      if (m.rowHeights[r]) tr.style.height = `${m.rowHeights[r]}px`;
      for (let c = 0; c < cols; c++) {
        if (m.hiddenCols.includes(c) || covered.has(`${r},${c}`)) continue;
        const td = h("td", { "data-r": r, "data-c": c }, m.data[r][c] ?? "");
        if (m.types[r]?.[c] === "n") td.className = "oth-num";
        const sp = spans.get(`${r},${c}`);
        if (sp) {
          // hidden rows/columns inside a merge must not be counted
          let rs = 0;
          for (let i = r; i < r + sp.rowspan; i++) if (!m.hiddenRows.includes(i)) rs++;
          let cs = 0;
          for (let i = c; i < c + sp.colspan; i++) if (!m.hiddenCols.includes(i)) cs++;
          if (rs > 1) td.rowSpan = rs;
          if (cs > 1) td.colSpan = cs;
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.append(thead, tbody);
    wrap.appendChild(table);
    if (m.data.length > maxRows) wrap.appendChild(h("div", { class: "oth-notice" }, ctx.t("rowsTruncated", { count: maxRows })));
    table.addEventListener("click", (e) => {
      const td = (e.target as Element).closest("td");
      if (!td) return;
      tableSelected?.classList.remove("oth-selected");
      td.classList.add("oth-selected");
      tableSelected = td;
      showCell(Number(td.dataset.r), Number(td.dataset.c));
    });
    grid.appendChild(wrap);
  };

  const renderHot = () => {
    const m = model!;
    const host = h("div", { style: "position:absolute;inset:0" });
    grid.appendChild(host);
    // Handsontable pads its data array in place: give it a copy
    const data = m.data.length ? m.data.map((r) => r.slice()) : [[""]];
    const settings: Record<string, unknown> = {
      data,
      licenseKey: opts.licenseKey ?? "non-commercial-and-evaluation",
      readOnly: opts.readOnly ?? true,
      rowHeaders: opts.rowHeaders ?? true,
      colHeaders: opts.colHeaders ?? true,
      width: "100%",
      height: "100%",
      colorScheme: ctx.isDark() ? "dark" : "light",
      layoutDirection: m.rtl ? "rtl" : ctx.rtl ? "rtl" : "ltr",
      wordWrap: false,
      readOnlyCellClassName: "",
      manualColumnResize: true,
      manualRowResize: true,
      outsideClickDeselects: false,
      columnSorting: opts.columnSorting ?? false,
      contextMenu: opts.contextMenu ?? false,
      fixedRowsTop: opts.fixedRowsTop ?? 0,
      fixedColumnsStart: opts.fixedColumnsStart ?? 0,
      search: true,
      mergeCells: m.merges.length ? m.merges : false,
      colWidths: (i: number) => m.colWidths[i] ?? 80,
      rowHeights: m.rowHeights.length ? (i: number) => m.rowHeights[i] ?? undefined : undefined,
      hiddenRows: m.hiddenRows.length ? { rows: m.hiddenRows, indicators: true } : undefined,
      hiddenColumns: m.hiddenCols.length ? { columns: m.hiddenCols, indicators: true } : undefined,
      minSpareRows: 0,
      minRows: 30,
      minCols: 12,
      cells: (row: number, col: number) => (m.types[row]?.[col] === "n" ? { className: "htRight" } : {}),
      afterSelection: (r: number, c: number) => {
        if (r >= 0 && c >= 0) showCell(r, c);
      },
      ...(opts.language ? { language: opts.language } : {}),
      ...(opts.handsontableSettings ?? {}),
    };
    for (const k of Object.keys(settings)) if (settings[k] === undefined) delete settings[k];
    hot = new Handsontable(host, settings);
  };

  const showSheet = (i: number) => {
    active = i;
    destroyGrid();
    searchHits = [];
    searchIndex = -1;
    const entry = sheets[i];
    const ws = wb.Sheets[entry.name];
    model = sheetToModel(XLSX, ws, entry.name, engine === "table" ? maxRows + 1 : Infinity);
    model.rtl = !!wb.Workbook?.Views?.[0]?.RTL;
    tabs.forEach((t, j) => {
      t.setAttribute("aria-selected", String(j === i));
      t.tabIndex = j === i ? 0 : -1;
    });
    tabs[i]?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    if (engine === "handsontable") renderHot();
    else renderTable();
    showCell(0, 0);
    const cols = model.data.reduce((n, r) => Math.max(n, r.length), 0);
    ctx.setStatus(`${entry.name} · ${model.data.length.toLocaleString()} × ${cols.toLocaleString()}`);
    ctx.update();
  };

  const runSearch = (q: string, matchCase = false): SearchState => {
    searchQuery = q;
    searchHits = [];
    searchIndex = -1;
    if (!model || !q) return { query: q, total: 0, current: -1 };
    const needle = matchCase ? q : q.toLowerCase();
    model.data.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v && (matchCase ? v : v.toLowerCase()).includes(needle)) searchHits.push({ row: r, col: c });
      }),
    );
    if (hot) {
      hot.getPlugin("search").query(q, undefined, (query: string, value: unknown) =>
        query && value !== null && value !== undefined && (matchCase ? String(value) : String(value).toLowerCase()).includes(matchCase ? query : query.toLowerCase()),
      );
      hot.render();
    }
    return gotoHit(searchHits.length ? 0 : -1);
  };

  const gotoHit = (i: number): SearchState => {
    searchIndex = i;
    const hit = searchHits[i];
    if (hit) {
      if (hot) {
        hot.selectCell(hit.row, hit.col);
        hot.scrollViewportTo?.({ row: hit.row, col: hit.col, verticalSnap: "top" });
      } else {
        const td = grid.querySelector<HTMLElement>(`td[data-r="${hit.row}"][data-c="${hit.col}"]`);
        if (td) {
          tableSelected?.classList.remove("oth-selected");
          td.classList.add("oth-selected");
          tableSelected = td;
          td.scrollIntoView?.({ block: "center", inline: "center" });
        }
      }
      showCell(hit.row, hit.col);
    }
    return { query: searchQuery, total: searchHits.length, current: searchIndex };
  };

  return {
    pageLabel: "sheet",
    async render() {
      XLSX = await ctx.lib("xlsx");
      if (!XLSX?.read) throw new OfficeError("LIBRARY_LOAD_ERROR", "SheetJS is not available");
      if (engine === "handsontable") {
        try {
          Handsontable = await ctx.lib("handsontable");
          if (typeof Handsontable !== "function") Handsontable = Handsontable?.default ?? Handsontable?.Handsontable;
          if (typeof Handsontable !== "function") throw new Error("Handsontable is not a constructor");
        } catch (err) {
          if (opts.engine === "handsontable") throw err;
          ctx.warn("Handsontable could not be loaded, falling back to the table engine", err);
          engine = "table";
        }
      }
      const bytes = ctx.file.bytes;
      const isText = TEXT_FORMATS.includes(ctx.file.ext) && !(bytes[0] === 0x50 && bytes[1] === 0x4b);
      try {
        wb = isText
          ? XLSX.read(decodeText(bytes).text, { type: "string", cellDates: true, cellStyles: true, dense: false, ...(opts.readOptions ?? {}) })
          : XLSX.read(bytes, { type: "array", cellDates: true, cellStyles: true, dense: false, ...(opts.readOptions ?? {}) });
      } catch (err) {
        const msg = (err as Error)?.message ?? String(err);
        if (/password|encrypt/i.test(msg)) throw new OfficeError("PASSWORD_REQUIRED", ctx.t("passwordRequired"), err);
        throw new OfficeError("PARSE_ERROR", `The workbook could not be read: ${msg}`, err);
      }
      const meta = wb.Workbook?.Sheets ?? [];
      sheets = (wb.SheetNames as string[])
        .map((name, index) => ({ name, index }))
        .filter(({ index }) => !(opts.skipHiddenSheets ?? true) || !meta[index]?.Hidden);
      if (!sheets.length) sheets = (wb.SheetNames as string[]).map((name, index) => ({ name, index }));

      ctx.container.appendChild(root);
      sheets.forEach((s, i) => {
        const tab = h("button", { type: "button", class: "oth-tab", role: "tab", "aria-selected": "false", title: s.name }, s.name);
        tab.addEventListener("click", () => showSheet(i));
        tab.addEventListener("keydown", (e) => {
          const dir = (e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0) * (ctx.rtl ? -1 : 1);
          if (!dir) return;
          e.preventDefault();
          const next = (i + dir + sheets.length) % sheets.length;
          showSheet(next);
          tabs[next].focus();
        });
        tabs.push(tab);
        tabList.appendChild(tab);
      });
      ctx.footer.appendChild(tabList);

      let first = 0;
      if (typeof opts.activeSheet === "number") first = Math.max(0, Math.min(sheets.length - 1, opts.activeSheet));
      else if (typeof opts.activeSheet === "string") first = Math.max(0, sheets.findIndex((s) => s.name === opts.activeSheet));
      else {
        const activeTab = wb.Workbook?.WBView?.[0]?.activeTab;
        if (typeof activeTab === "number") first = Math.max(0, sheets.findIndex((s) => s.index === activeTab));
      }
      showSheet(first);
    },
    destroy() {
      destroyGrid();
      root.remove();
      tabList.remove();
    },
    getPageCount: () => sheets.length,
    getPage: () => active + 1,
    setPage(n) {
      const i = Math.max(0, Math.min(sheets.length - 1, n - 1));
      if (i !== active) showSheet(i);
    },
    onThemeChange(dark) {
      hot?.updateSettings({ colorScheme: dark ? "dark" : "light" });
    },
    onResize() {
      hot?.refreshDimensions?.();
    },
    onKeyDown(e) {
      if (e.ctrlKey && (e.key === "PageDown" || e.key === "PageUp")) {
        e.preventDefault();
        const next = (active + (e.key === "PageDown" ? 1 : -1) + sheets.length) % sheets.length;
        showSheet(next);
        return true;
      }
      return false;
    },
    search: (q, o) => runSearch(q, !!o.matchCase),
    searchNext: () => gotoHit(searchHits.length ? (searchIndex + 1) % searchHits.length : -1),
    searchPrevious: () => gotoHit(searchHits.length ? (searchIndex - 1 + searchHits.length) % searchHits.length : -1),
    clearSearch() {
      searchHits = [];
      searchIndex = -1;
      if (hot) {
        hot.getPlugin("search").query("");
        hot.render();
      }
    },
    async print() {
      if (!model) return;
      const m = model;
      const table = document.createElement("table");
      const rows = Math.min(m.data.length, 10000);
      for (let r = 0; r < rows; r++) {
        if (m.hiddenRows.includes(r)) continue;
        const tr = table.insertRow();
        m.data[r].forEach((v, c) => {
          if (m.hiddenCols.includes(c)) return;
          const td = tr.insertCell();
          td.textContent = v;
          if (m.types[r]?.[c] === "n") td.style.textAlign = "right";
        });
      }
      const title = document.createElement("h3");
      title.textContent = m.name;
      await printDocument({
        content: [title, table],
        title: `${ctx.file.name} - ${m.name}`,
        pageSize: "A4 landscape",
        margin: "10mm",
        css: "h3{font:600 12pt system-ui,sans-serif;margin:0 0 6px}table{border-collapse:collapse;font:9pt system-ui,sans-serif}td{border:1px solid #ccc;padding:2px 5px;white-space:pre}",
      });
    },
    async getText() {
      return sheets.map((s) => `# ${s.name}\n${XLSX.utils.sheet_to_csv(wb.Sheets[s.name])}`).join("\n\n");
    },
  };
}
