import { OfficeViewer, type OfficeViewerOptions } from "@meshesha/officetohtml";

const files = ["demo.docx", "demo.pptx", "demo.xlsx", "demo.pdf", "demo.jpg", "demo.svg", "demo.csv", "demo.json", "demo.md"];
const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;
const log = (msg: string) => {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} ${msg}`;
  $("#log").prepend(li);
};

let viewer: OfficeViewer | null = null;
let currentFile = "";

function options(): OfficeViewerOptions {
  return {
    theme: $<HTMLSelectElement>("#theme").value as OfficeViewerOptions["theme"],
    locale: $<HTMLSelectElement>("#locale").value || undefined,
    height: "100%",
    pdf: { assetsBase: "/pdfjs/" },
    sheet: { engine: $<HTMLSelectElement>("#engine").value as "handsontable" | "table" },
  };
}

function create() {
  viewer?.destroy();
  viewer = new OfficeViewer("#viewer", options());
  viewer.on("loadstart", () => log("loadstart"));
  viewer.on("load", ({ file }) => log(`load ${file.name} (${file.kind}, ${file.size} bytes)`));
  viewer.on("error", ({ error }) => log(`error ${error.code}: ${error.message}`));
  viewer.on("warning", ({ message }) => log(`warning ${message}`));
  viewer.on("pagechange", ({ page, total }) => log(`page ${page}/${total}`));
  viewer.on("zoomchange", ({ zoom }) => log(`zoom ${Math.round(zoom * 100)}%`));
  (window as any).viewer = viewer;
  if (currentFile) viewer.load(`./files/${currentFile}`).catch(() => undefined);
}

for (const f of files) {
  const b = document.createElement("button");
  b.textContent = f;
  b.onclick = () => {
    currentFile = f;
    document.querySelectorAll("#files button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    viewer!.load(`./files/${f}`).catch(() => undefined);
  };
  $("#files").appendChild(b);
}
$("#theme").addEventListener("change", () => viewer?.setTheme($<HTMLSelectElement>("#theme").value as "auto"));
$("#locale").addEventListener("change", create);
$("#engine").addEventListener("change", create);
create();
const initial = new URLSearchParams(location.search).get("file");
if (initial) (document.querySelectorAll("#files button")[files.indexOf(initial)] as HTMLButtonElement)?.click();
