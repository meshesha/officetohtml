// Checks the built website (served at baseUrl): every page loads without errors,
// the demos page renders every sample file, and screenshots are saved to test/output.
// Usage: node scripts/site-check.mjs [baseUrl]
import { chromium } from "playwright-core";
const base = process.argv[2] ?? "http://localhost:5191/";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const results = [];
const watch = (page) => {
  page.on("pageerror", (e) => errors.push(`${page.url()} pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && !/googletagmanager|gtag/.test(m.text()) && errors.push(`${page.url()} console: ${m.text()}`));
  page.on("requestfailed", (r) => !/googletagmanager|google-analytics/.test(r.url()) && errors.push(`failed: ${r.url()}`));
};

const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
watch(page);
await page.route(/googletagmanager|google-analytics/, (r) => r.abort());

await page.goto(base);
await page.waitForSelector("#hero-viewer .pptxjs .slide", { timeout: 30000 }).then(() => results.push("OK   home hero slideshow")).catch(() => results.push("FAIL home hero slideshow"));
await page.waitForTimeout(800);
await page.screenshot({ path: "test/output/site-home.png", fullPage: false });
await page.screenshot({ path: "test/output/site-home-full.png", fullPage: true });

for (const f of ["demo.docx", "demo.pptx", "demo.xlsx", "demo.csv", "demo.pdf", "demo.jpg", "demo.svg", "demo.json", "demo.md"]) {
  await page.goto(`${base}pages/demos.html#${f}`);
  await page.reload();
  const ok = await page
    .waitForFunction((n) => (document.querySelector("#log")?.textContent ?? "").includes("load – " + n), f, { timeout: 40000 })
    .then(() => true)
    .catch(() => false);
  results.push(`${ok ? "OK  " : "FAIL"} demos ${f}`);
}
await page.goto(`${base}pages/demos.html#demo.pdf`);
await page.reload();
await page.waitForSelector(".oth-pdf .page canvas", { timeout: 30000 }).catch(() => undefined);
await page.waitForTimeout(1200);
await page.screenshot({ path: "test/output/site-demos-pdf.png" });

await page.goto(`${base}pages/docs.html`);
await page.waitForTimeout(300);
await page.screenshot({ path: "test/output/site-docs.png" });
results.push(`OK   docs (${(await page.$$("h2")).length} sections)`);

await page.goto(`${base}pages/lang.html`);
await page.waitForSelector("#viewer .oth-docx-page", { timeout: 30000 }).then(() => results.push("OK   lang preview")).catch(() => results.push("FAIL lang preview"));
await page.screenshot({ path: "test/output/site-lang.png" });

// mobile + dark
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: "dark", isMobile: true, hasTouch: true });
watch(mobile);
await mobile.route(/googletagmanager|google-analytics/, (r) => r.abort());
await mobile.goto(base);
await mobile.waitForTimeout(2500);
await mobile.screenshot({ path: "test/output/site-mobile-home.png" });
await mobile.goto(`${base}pages/demos.html#demo.xlsx`);
await mobile.reload();
await mobile.waitForTimeout(3500);
await mobile.screenshot({ path: "test/output/site-mobile-demos.png" });
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
results.push(`${overflow ? "FAIL" : "OK  "} mobile has no horizontal scroll`);

console.log(results.join("\n"));
if (errors.length) console.log("errors:\n  " + [...new Set(errors)].slice(0, 15).join("\n  "));
await browser.close();
