/**
 * Modern image viewer: fit / actual size, zoom to cursor (wheel, Ctrl+wheel,
 * pinch), pan (drag, arrows), rotate, flip, transparency grid, full screen.
 *
 * Images (including SVG) are shown through <img> with a blob: URL, so scripts
 * inside SVG files never run.
 */
import { clamp, h } from "../core/dom";
import { printDocument } from "../core/print";
import { sniffImage } from "../core/detect";
import { OfficeError } from "../errors";
import type { Renderer, RendererContext, ZoomPreset } from "../types";

const MIME: Record<string, string> = {
  png: "image/png", jpeg: "image/jpeg", jpg: "image/jpeg", gif: "image/gif", bmp: "image/bmp", webp: "image/webp", avif: "image/avif",
  svg: "image/svg+xml", ico: "image/x-icon", cur: "image/x-icon", tif: "image/tiff", tiff: "image/tiff", apng: "image/apng",
};

export interface ImageViewState {
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  tx: number;
  ty: number;
}

/** Scale that fits an image (after rotation) into a box; never upscales unless `allowUpscale`. */
export function fitScale(imgW: number, imgH: number, boxW: number, boxH: number, rotation: number, allowUpscale = false, padding = 16): number {
  if (!imgW || !imgH || !boxW || !boxH) return 1;
  const rotated = Math.abs(rotation % 180) === 90;
  const w = rotated ? imgH : imgW;
  const h = rotated ? imgW : imgH;
  const s = Math.min((boxW - padding * 2) / w, (boxH - padding * 2) / h);
  return allowUpscale ? Math.max(s, 0.01) : Math.min(1, Math.max(s, 0.01));
}

/** New translation so that the point (px, py) (relative to the stage centre) stays fixed when zooming by `k`. */
export function zoomAround(tx: number, ty: number, px: number, py: number, k: number): { tx: number; ty: number } {
  return { tx: px + (tx - px) * k, ty: py + (ty - py) * k };
}

export function createImageRenderer(ctx: RendererContext): Renderer {
  const opts = ctx.options.image ?? {};
  const maxZoom = opts.maxZoom ?? 20;
  const step = opts.zoomStep ?? 1.25;
  const state: ImageViewState = { scale: 1, rotation: 0, flipX: false, flipY: false, tx: 0, ty: 0 };
  let mode: "fit" | "custom" = "fit";
  let url = "";
  let natW = 0;
  let natH = 0;
  let checker = opts.checkerboard ?? false;
  const cleanups: Array<() => void> = [];

  const stage = h("div", { class: "oth-image-stage", tabindex: "0", role: "img", "aria-label": ctx.file.name });
  if (opts.background) stage.style.background = opts.background;
  const img = h("img", { class: "oth-image", alt: ctx.file.name, draggable: "false", decoding: "async" });
  stage.appendChild(img);

  const stageSize = () => ({ w: stage.clientWidth, hgt: stage.clientHeight });

  const apply = () => {
    const { w, hgt } = stageSize();
    img.style.left = `${(w - natW) / 2}px`;
    img.style.top = `${(hgt - natH) / 2}px`;
    const sx = state.scale * (state.flipX ? -1 : 1);
    const sy = state.scale * (state.flipY ? -1 : 1);
    img.style.transform = `translate(${state.tx}px, ${state.ty}px) rotate(${state.rotation}deg) scale(${sx}, ${sy})`;
    img.classList.toggle("oth-pixelated", state.scale >= 3);
    stage.classList.toggle("oth-checker", checker);
  };

  const fit = () => {
    const { w, hgt } = stageSize();
    state.scale = fitScale(natW, natH, w, hgt, state.rotation);
    state.tx = 0;
    state.ty = 0;
    mode = "fit";
    apply();
  };

  const minScale = () => {
    const { w, hgt } = stageSize();
    return Math.min(0.05, fitScale(natW, natH, w, hgt, state.rotation) / 2);
  };

  /** Zooms to `scale` keeping the stage point (cx, cy) (client coords) fixed. */
  const zoomTo = (scale: number, clientX?: number, clientY?: number) => {
    const next = clamp(scale, minScale(), maxZoom);
    const rect = stage.getBoundingClientRect();
    const px = clientX === undefined ? 0 : clientX - rect.left - rect.width / 2;
    const py = clientY === undefined ? 0 : clientY - rect.top - rect.height / 2;
    const k = next / state.scale;
    const t = zoomAround(state.tx, state.ty, px, py, k);
    state.tx = t.tx;
    state.ty = t.ty;
    state.scale = next;
    mode = "custom";
    apply();
    ctx.update();
  };

  const rotate = (deg: number) => {
    state.rotation = (((state.rotation + deg) % 360) + 360) % 360;
    if (mode === "fit") fit();
    else apply();
  };

  const status = () => ctx.setStatus(`${ctx.t("dimensions", { width: natW, height: natH })}`);

  // ---- pointer interaction (pan + pinch)
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDist = 0;
  let pinchScale = 1;
  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    stage.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      pinchScale = state.scale;
    }
    stage.classList.add("oth-dragging");
  };
  const onMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0) zoomTo(pinchScale * (d / pinchDist), (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }
    state.tx += cur.x - prev.x;
    state.ty += cur.y - prev.y;
    mode = "custom";
    apply();
  };
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (!pointers.size) stage.classList.remove("oth-dragging");
  };
  const onWheel = (e: WheelEvent) => {
    if (!(opts.wheelZoom ?? true) && !e.ctrlKey) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015));
    zoomTo(state.scale * factor, e.clientX, e.clientY);
  };
  const onDbl = (e: MouseEvent) => {
    if (mode === "fit" && state.scale < 1) zoomTo(1, e.clientX, e.clientY);
    else if (mode === "fit") zoomTo(state.scale * 2, e.clientX, e.clientY);
    else fit();
    ctx.update();
  };

  return {
    async render() {
      const sniff = sniffImage(ctx.file.bytes);
      const mime = MIME[sniff ?? ""] ?? MIME[ctx.file.ext] ?? (ctx.file.mime.startsWith("image/") ? ctx.file.mime : "application/octet-stream");
      url = URL.createObjectURL(new Blob([ctx.file.bytes as BlobPart], { type: mime }));
      ctx.container.appendChild(stage);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new OfficeError("PARSE_ERROR", sniff === "tiff" ? "This browser cannot display TIFF images." : "The image could not be decoded."));
        img.src = url;
      });
      natW = img.naturalWidth || 300;
      natH = img.naturalHeight || 150;
      img.style.width = `${natW}px`;
      img.style.height = `${natH}px`;
      if (opts.zoom === undefined || opts.zoom === "auto" || opts.zoom === "page-fit") fit();
      else if (opts.zoom === "page-actual") zoomTo(1);
      else if (typeof opts.zoom === "number") zoomTo(opts.zoom);
      else fit();

      stage.addEventListener("pointerdown", onDown);
      stage.addEventListener("pointermove", onMove);
      stage.addEventListener("pointerup", onUp);
      stage.addEventListener("pointercancel", onUp);
      stage.addEventListener("wheel", onWheel, { passive: false });
      stage.addEventListener("dblclick", onDbl);
      cleanups.push(() => {
        stage.removeEventListener("pointerdown", onDown);
        stage.removeEventListener("pointermove", onMove);
        stage.removeEventListener("pointerup", onUp);
        stage.removeEventListener("pointercancel", onUp);
        stage.removeEventListener("wheel", onWheel);
        stage.removeEventListener("dblclick", onDbl);
      });

      const tb = ctx.toolbar;
      tb.button({ icon: "rotateLeft", label: ctx.t("rotateLeft"), onClick: () => rotate(-90) });
      tb.button({ icon: "rotateRight", label: ctx.t("rotateRight"), onClick: () => rotate(90) });
      tb.button({ icon: "flipH", label: ctx.t("flipHorizontal"), onClick: () => ((state.flipX = !state.flipX), apply()) });
      tb.button({ icon: "flipV", label: ctx.t("flipVertical"), onClick: () => ((state.flipY = !state.flipY), apply()) });
      const checkBtn = tb.button({ icon: "checker", label: ctx.t("transparencyGrid"), pressed: checker, onClick: () => {
        checker = !checker;
        tb.setPressed(checkBtn, checker);
        apply();
      } });
      tb.button({ icon: "reset", label: ctx.t("reset"), onClick: () => {
        state.rotation = 0;
        state.flipX = state.flipY = false;
        fit();
        ctx.update();
      } });
      status();
    },
    destroy() {
      cleanups.forEach((f) => f());
      stage.remove();
      if (url) URL.revokeObjectURL(url);
      url = "";
    },
    getZoom: () => Math.round(state.scale * 1000) / 1000,
    setZoom(z: number | ZoomPreset) {
      if (z === "auto" || z === "page-fit" || z === "page-width") fit();
      else if (z === "page-actual") zoomTo(1);
      else zoomTo(z);
    },
    zoomPresets: ["auto", "page-actual"],
    onResize() {
      if (mode === "fit") fit();
      else apply();
    },
    onKeyDown(e) {
      const panStep = e.shiftKey ? 120 : 40;
      switch (e.key) {
        case "+":
        case "=":
          zoomTo(state.scale * step);
          return true;
        case "-":
          zoomTo(state.scale / step);
          return true;
        case "0":
          fit();
          ctx.update();
          return true;
        case "1":
          zoomTo(1);
          return true;
        case "r":
          rotate(90);
          return true;
        case "R":
          rotate(-90);
          return true;
        case "ArrowLeft":
          state.tx += panStep;
          break;
        case "ArrowRight":
          state.tx -= panStep;
          break;
        case "ArrowUp":
          state.ty += panStep;
          break;
        case "ArrowDown":
          state.ty -= panStep;
          break;
        default:
          return false;
      }
      mode = "custom";
      apply();
      return true;
    },
    async print() {
      const im = document.createElement("img");
      im.src = url;
      const rot = state.rotation ? `transform:rotate(${state.rotation}deg);` : "";
      im.setAttribute("style", `${rot}max-width:100%;max-height:100vh;object-fit:contain`);
      const page = document.createElement("div");
      page.className = "oth-print-page";
      page.appendChild(im);
      await printDocument({ content: page, title: ctx.file.name, margin: "8mm" });
    },
  };
}
