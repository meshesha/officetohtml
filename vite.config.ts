/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import { resolve } from "node:path";
import { VIEWER_CSS } from "./src/core/styles";

/** Emits dist/officetohtml.css (the styles are also injected at runtime unless `injectStyles: false`). */
function cssFile(): Plugin {
  return {
    name: "officetohtml-css",
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "officetohtml.css", source: `/* OfficeToHtml v2 */\n${VIEWER_CSS.trim()}\n` });
    },
  };
}

// Library build: ES modules + CommonJS for the core and every adapter.
// Third-party libraries stay external and are loaded with dynamic import()
// only when a file of that type is opened.
export default defineConfig({
  plugins: [cssFile()],
  define: { __OTH_UMD__: "false" },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    target: "es2020",
    lib: {
      entry: {
        officetohtml: resolve(__dirname, "src/index.ts"),
        react: resolve(__dirname, "src/adapters/react.ts"),
        vue: resolve(__dirname, "src/adapters/vue.ts"),
        angular: resolve(__dirname, "src/adapters/angular.ts"),
        jquery: resolve(__dirname, "src/adapters/jquery.ts"),
        element: resolve(__dirname, "src/adapters/element.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, name) => `${name}.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: [
        "react", "react/jsx-runtime", "vue", "jquery", "@angular/core",
        "pdfjs-dist", /^pdfjs-dist\//, "mammoth", /^mammoth\//, "xlsx", "handsontable", /^handsontable\//,
        "@meshesha/pptxjs", /^@meshesha\/pptxjs\//, "dompurify", "fflate",
      ],
      output: { exports: "named" },
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    testTimeout: 60000,
    hookTimeout: 60000,
    pool: "forks",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      reporter: ["text-summary", "html"],
    },
  },
});
