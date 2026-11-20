import { defineConfig } from "vite";
import { resolve } from "node:path";

// Single-file browser bundle for <script> tags: window.OfficeToHtml.
// DOMPurify and fflate are bundled; PDF.js, mammoth, SheetJS, Handsontable and
// PPTXjs are loaded on demand from `libs.urls` (default: version-pinned CDNs)
// or picked up from globals you include yourself.
export default defineConfig({
  define: { __OTH_UMD__: "true" },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    target: "es2020",
    minify: "esbuild",
    lib: {
      entry: resolve(__dirname, "src/umd.ts"),
      name: "OfficeToHtml",
      formats: ["umd"],
      fileName: () => "officetohtml.umd.js",
    },
    rollupOptions: {
      output: { inlineDynamicImports: true, exports: "named" },
    },
  },
});
