// Interactive checks in a real Chrome against the dev playground (npm run dev).
// Usage: node scripts/interact.mjs [baseUrl]
import { chromium } from "playwright-core";
const base = process.argv[2] ?? "http://localhost:5190/";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "OK  " : "FAIL"} ${name} ${extra}`);
const open = async (file) => {
  await page.goto(`${base}?file=${file}`);
  await page.waitForFunction(() => /\bload demo/.test(document.querySelector("#log")?.textContent ?? ""), null, { timeout: 45000 });
  await page.waitForTimeout(800);
};
const viewer = (fn, arg) => page.evaluate(fn, arg);

// DOCX: search + zoom + dark
await open("demo.docx");
const docxSearch = await viewer(async () => (await window.viewer.search("security"))?.total ?? 0);
check("docx search", docxSearch > 3, `(${docxSearch} hits)`);
await viewer(() => window.viewer.zoomIn());
check("docx zoom", (await viewer(() => window.viewer.zoom)) > 1, String(await viewer(() => window.viewer.zoom)));
await viewer(() => window.viewer.setTheme("dark"));
await page.screenshot({ path: "test/output/i-docx-dark.png" });
await viewer(() => window.viewer.setTheme("light"));

// PDF: search, page nav, rotate, sidebar
await open("demo.pdf");
await page.waitForSelector(".oth-pdf .textLayer span", { timeout: 20000 });
await viewer(() => window.viewer.search("JavaScript"));
await page.waitForTimeout(2500);
const pdfCount = await page.textContent(".oth-search-count");
check("pdf search", /\d+ of \d+/.test(pdfCount ?? ""), pdfCount);
await viewer(() => window.viewer.goToPage(3));
await page.waitForTimeout(500);
check("pdf goToPage", (await viewer(() => window.viewer.page)) === 3);
await page.click('button[aria-label="Toggle sidebar"]');
await page.waitForSelector(".oth-thumb canvas", { timeout: 15000 }).then(() => check("pdf thumbnails", true)).catch(() => check("pdf thumbnails", false));
await viewer(() => window.viewer.setZoom("page-width"));
await page.screenshot({ path: "test/output/i-pdf-sidebar.png" });
const text = await viewer(() => window.viewer.getText());
check("pdf getText", text.length > 1000, `(${text.length} chars)`);

// PPTX: slideshow
await open("demo.pptx");
await page.click('button[aria-label="Slideshow"]');
await page.waitForTimeout(600);
await viewer(() => window.viewer.nextPage());
await page.waitForTimeout(900);
check("pptx slideshow next", (await viewer(() => window.viewer.page)) === 2);
await page.screenshot({ path: "test/output/i-pptx-slideshow.png" });

// XLSX (handsontable): search + formula bar
await open("demo.xlsx");
const hits = await viewer(async () => (await window.viewer.search("Passover"))?.total ?? 0);
check("sheet search", hits > 0, `(${hits})`);
check("formula bar", ((await page.inputValue(".oth-formula-value")) ?? "").includes("Passover"));
await page.screenshot({ path: "test/output/i-sheet-search.png" });

// Image: zoom & rotate
await open("demo.jpg");
const z0 = await viewer(() => window.viewer.zoom);
await page.mouse.move(500, 400);
await page.mouse.wheel(0, -300);
await page.waitForTimeout(200);
const z1 = await viewer(() => window.viewer.zoom);
check("image wheel zoom", z1 > z0, `${z0} -> ${z1}`);
await page.click('button[aria-label="Rotate right"]');
check("image rotate", (await page.getAttribute(".oth-image", "style")).includes("rotate(90deg)"));

// Hebrew UI
await page.goto(`${base}`);
await page.selectOption("#locale", "he");
await page.waitForTimeout(300);
check("rtl locale", (await page.getAttribute(".oth", "dir")) === "rtl");
await page.screenshot({ path: "test/output/i-he-empty.png" });

console.log(results.join("\n"));
if (errors.length) console.log("page errors:\n  " + errors.slice(0, 8).join("\n  "));
await browser.close();
