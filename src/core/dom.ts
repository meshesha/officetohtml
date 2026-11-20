/** Tiny DOM helpers. Text is always set with textContent (never innerHTML). */

type Attrs = Record<string, string | number | boolean | null | undefined>;
type Child = Node | string | null | undefined | false;

/** Creates an element: `h("button", { class: "x", title: "y" }, "text")`. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

/** Parses a trusted, static SVG string (our own icons only) into an element. */
export function svg(markup: string): SVGElement {
  const tpl = document.createElement("template");
  tpl.innerHTML = markup.trim();
  return tpl.content.firstElementChild as SVGElement;
}

export function clear(el: Element): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function resolveElement(target: HTMLElement | string): HTMLElement {
  if (typeof target !== "string") {
    if (!target || typeof (target as HTMLElement).appendChild !== "function") throw new Error("OfficeViewer: container element is required");
    return target;
  }
  const el = document.querySelector<HTMLElement>(target);
  if (!el) throw new Error(`OfficeViewer: no element matches "${target}"`);
  return el;
}

let uid = 0;
/** Unique id for ARIA relations, `oth-<prefix>-<n>`. */
export function uniqueId(prefix: string): string {
  uid += 1;
  return `oth-${prefix}-${uid}`;
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

/** Text direction of a string from its first strong character. */
export function detectTextDirection(text: string): "rtl" | "ltr" | null {
  const m = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]|[֐-ࣿיִ-﷿ﹰ-﻿]/.exec(text);
  if (!m) return null;
  return /[֐-ࣿיִ-﷿ﹰ-﻿]/.test(m[0]) ? "rtl" : "ltr";
}

/** Ratio of right-to-left letters among all letters in the text. */
export function rtlRatio(text: string): number {
  const rtl = text.match(/[֐-ࣿיִ-﷿ﹰ-﻿]/g)?.length ?? 0;
  const ltr = text.match(/[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/g)?.length ?? 0;
  return rtl + ltr === 0 ? 0 : rtl / (rtl + ltr);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Triggers a browser download of bytes. */
export function downloadBytes(bytes: Uint8Array, fileName: string, mime = "application/octet-stream"): void {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "document";
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
