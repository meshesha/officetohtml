/**
 * Printing that only prints the document, not the whole page (GitHub issue #10).
 *
 * The content is written into a hidden, sandboxed iframe (`allow-modals` for
 * the print dialog, `allow-same-origin` so we can call print(); scripts are
 * NOT allowed, so nothing inside the document can run), printed and removed.
 */
export interface PrintJob {
  /** Body content: a sanitised HTML string or nodes (cloned). */
  content: string | Node | Node[];
  /** Extra CSS for the print document. */
  css?: string;
  title?: string;
  /** Page size / orientation, e.g. "A4 landscape" or "auto". */
  pageSize?: string;
  /** Page margin, e.g. "0" or "12mm". */
  margin?: string;
  dir?: "ltr" | "rtl";
}

const BASE_PRINT_CSS = `
html,body{margin:0;padding:0;background:#fff;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
img,svg,canvas{max-width:100%}
.oth-print-page{break-after:page;page-break-after:always;display:flex;justify-content:center;align-items:center}
.oth-print-page:last-child{break-after:auto;page-break-after:auto}
.oth-print-page img{max-width:100%;max-height:100vh;object-fit:contain}
`;

function escapeText(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Opens the print dialog for `job`. Resolves after the dialog closes (or a timeout). */
export function printDocument(job: PrintJob): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-modals allow-same-origin");
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    const page = `@page{size:${job.pageSize ?? "auto"};margin:${job.margin ?? "12mm"}}`;
    doc.open();
    doc.write(
      `<!doctype html><html dir="${job.dir ?? "ltr"}"><head><meta charset="utf-8"><title>${escapeText(job.title ?? "")}</title>` +
        `<style>${page}${BASE_PRINT_CSS}${job.css ?? ""}</style></head><body></body></html>`,
    );
    doc.close();
    if (typeof job.content === "string") {
      doc.body.innerHTML = job.content;
    } else {
      const nodes = Array.isArray(job.content) ? job.content : [job.content];
      for (const n of nodes) doc.body.appendChild(doc.importNode(n, true));
    }

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      setTimeout(() => iframe.remove(), 100);
      resolve();
    };

    const images = Array.from(doc.images);
    const ready = Promise.all(
      images.map((img) => (img.complete ? Promise.resolve() : new Promise<void>((r) => ((img.onload = () => r()), (img.onerror = () => r()))))),
    );
    ready.then(() => {
      const win = iframe.contentWindow;
      if (!win) return cleanup();
      win.addEventListener("afterprint", cleanup);
      try {
        win.focus();
        win.print();
      } catch (err) {
        console.error("[officetohtml] print failed", err);
      }
      // Some browsers do not fire afterprint for iframes.
      setTimeout(cleanup, 60000);
    });
  });
}

/** Wraps each image URL in a print page. */
export function imagesToPrintHtml(urls: string[]): string {
  return urls.map((u) => `<div class="oth-print-page"><img src="${escapeText(u)}" alt=""></div>`).join("");
}
