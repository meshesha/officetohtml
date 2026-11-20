// Copies the OfficeToHtml build and the third-party libraries it loads on
// demand into officetohtml.js.org/lib and officetohtml.js.org/vendor, so the
// website works without public CDNs.  Run with `npm run build:site`.
import { cpSync, existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "officetohtml.js.org");
const nm = join(root, "node_modules");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const copy = (from, to) => {
  const src = join(root, from);
  if (!existsSync(src)) throw new Error(`missing ${from} - run npm install / npm run build first`);
  mkdirSync(dirname(join(site, to)), { recursive: true });
  cpSync(src, join(site, to), { recursive: true });
};

for (const dir of ["lib", "vendor"]) rmSync(join(site, dir), { recursive: true, force: true });

// OfficeToHtml itself
copy("dist/officetohtml.umd.js", "lib/officetohtml.umd.js");
copy("dist/officetohtml.umd.js.map", "lib/officetohtml.umd.js.map");
copy("dist/officetohtml.css", "lib/officetohtml.css");

// PDF.js (library, viewer components, worker, CMaps, fonts, wasm, colour profiles, viewer CSS + images)
for (const p of ["build/pdf.min.mjs", "build/pdf.worker.min.mjs", "web/pdf_viewer.mjs", "web/pdf_viewer.css", "web/images", "cmaps", "standard_fonts", "wasm", "iccs", "LICENSE"]) {
  if (existsSync(join(nm, "pdfjs-dist", p))) copy(`node_modules/pdfjs-dist/${p}`, `vendor/pdfjs/${p}`);
}
copy("node_modules/mammoth/mammoth.browser.min.js", "vendor/mammoth/mammoth.browser.min.js");
copy("node_modules/mammoth/LICENSE", "vendor/mammoth/LICENSE");
copy("node_modules/xlsx/dist/xlsx.full.min.js", "vendor/xlsx/xlsx.full.min.js");
copy("node_modules/xlsx/LICENSE", "vendor/xlsx/LICENSE");
copy("node_modules/handsontable/dist/handsontable.full.min.js", "vendor/handsontable/handsontable.full.min.js");
copy("node_modules/handsontable/LICENSE.txt", "vendor/handsontable/LICENSE.txt");
copy("node_modules/@meshesha/pptxjs/dist/pptxjs.umd.js", "vendor/pptxjs/pptxjs.umd.js");
copy("node_modules/@meshesha/pptxjs/LICENSE", "vendor/pptxjs/LICENSE");

writeFileSync(join(site, "lib/VERSION"), `${pkg.version}\n`);
console.log(`officetohtml.js.org: copied OfficeToHtml ${pkg.version} and vendor libraries`);
