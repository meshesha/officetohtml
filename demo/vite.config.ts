import { defineConfig, type Plugin } from "vite";
import { resolve, join, normalize } from "node:path";
import { createReadStream, existsSync, statSync } from "node:fs";

const PDFJS = resolve(__dirname, "../node_modules/pdfjs-dist");
const TYPES: Record<string, string> = { ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".gif": "image/gif", ".bcmap": "application/octet-stream", ".wasm": "application/wasm", ".pfb": "application/octet-stream", ".ttf": "font/ttf", ".icc": "application/octet-stream" };

/** Serves node_modules/pdfjs-dist at /pdfjs/ so the demo works offline (worker, cmaps, fonts, css). */
function pdfAssets(): Plugin {
  return {
    name: "pdfjs-assets",
    configureServer(server) {
      server.middlewares.use("/pdfjs/", (req, res, next) => {
        const rel = normalize(decodeURIComponent((req.url ?? "/").split("?")[0])).replace(/^[/\\]+/, "");
        const file = join(PDFJS, rel);
        if (!file.startsWith(PDFJS) || !existsSync(file) || !statSync(file).isFile()) return next();
        const ext = file.slice(file.lastIndexOf("."));
        res.setHeader("Content-Type", TYPES[ext] ?? "application/octet-stream");
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  root: __dirname,
  plugins: [pdfAssets()],
  define: { __OTH_UMD__: "false" },
  resolve: {
    alias: { "@meshesha/officetohtml": resolve(__dirname, "../src/index.ts") },
  },
  server: { port: 5180, fs: { allow: [resolve(__dirname, "..")] } },
  build: { outDir: resolve(__dirname, "../dist-demo"), emptyOutDir: true },
});
