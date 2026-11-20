// Headless smoke test of the dev playground: opens each sample file and saves a screenshot.
// Usage: node scripts/smoke.mjs [baseUrl] [files]   (requires a local Chrome; start `npm run dev` first)
import { chromium } from "playwright-core";
const base = process.argv[2] ?? "http://localhost:5181/";
const files = (process.argv[3] ?? "demo.docx,demo.pptx,demo.xlsx,demo.pdf,demo.jpg,demo.svg,demo.csv,demo.json,demo.md").split(",");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
let failed = 0;
for (const f of files) {
  errors.length = 0;
  await page.goto(`${base}?file=${f}`);
  const res = await page.waitForFunction(() => {
    const log = document.querySelector("#log")?.textContent ?? "";
    return /\bload demo|\berror /.test(log) ? log : null;
  }, null, { timeout: 45000 }).then((h) => h.jsonValue()).catch(() => "TIMEOUT");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `test/output/${f}.png` });
  const ok = /load demo/.test(res);
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FAIL"} ${f}  ${ok ? "" : String(res).slice(0, 300)}`);
  for (const e of errors.slice(0, 5)) console.log("     " + e.slice(0, 300));
}
await browser.close();
process.exit(failed ? 1 : 0);
