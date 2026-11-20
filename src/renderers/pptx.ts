/** PowerPoint (.pptx) renderer based on PPTXjs v2 (@meshesha/pptxjs). */
import { h, svg } from "../core/dom";
import { ICONS } from "../core/icons";
import { printDocument } from "../core/print";
import { TextSearch } from "../core/search";
import { OfficeError } from "../errors";
import type { Renderer, RendererContext, ZoomPreset } from "../types";

export function createPptxRenderer(ctx: RendererContext): Renderer {
  const opts = ctx.options.pptx ?? {};
  let viewer: any = null;
  let lib: any = null;
  let mode: "list" | "slideshow" = opts.mode ?? "list";
  let scale: "fit" | "contain" | number = opts.scale ?? (mode === "slideshow" ? "contain" : "fit");
  let search: TextSearch | null = null;
  let current = 0;
  const offs: Array<() => void> = [];
  const host = h("div", { class: "oth-pptx", tabindex: "0" });

  const slideCount = () => viewer?.slideCount ?? 0;

  /** In list mode: index of the slide nearest to the top of the viewport. */
  const visibleSlide = (): number => {
    const slides = host.querySelectorAll<HTMLElement>(".slide");
    if (!slides.length) return 0;
    const top = host.getBoundingClientRect().top + 40;
    let best = 0;
    slides.forEach((s, i) => {
      if (s.getBoundingClientRect().top <= top) best = i;
    });
    return best;
  };

  let scrollRaf = 0;
  const onScroll = () => {
    if (mode !== "list") return;
    cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => {
      const i = visibleSlide();
      if (i !== current) {
        current = i;
        ctx.update();
      }
    });
  };

  let modeBtn: HTMLButtonElement | null = null;
  let playBtn: HTMLButtonElement | null = null;

  const setMode = (m: "list" | "slideshow") => {
    mode = m;
    viewer.setMode(m);
    scale = m === "slideshow" ? "contain" : "fit";
    viewer.setOptions({ scale });
    if (m === "slideshow") viewer.goTo(current);
    else viewer.getSlideElement(current)?.scrollIntoView({ block: "start" });
    if (modeBtn) {
      ctx.toolbar.setPressed(modeBtn, m === "slideshow");
    }
    if (playBtn) playBtn.hidden = m !== "slideshow";
    search?.clear();
    ctx.update();
  };

  return {
    pageLabel: "slide",
    async render() {
      lib = await ctx.lib("pptxjs");
      const PptxViewer = lib?.PptxViewer;
      if (!PptxViewer) throw new OfficeError("LIBRARY_LOAD_ERROR", "PPTXjs v2 is not available");
      ctx.container.appendChild(host);
      viewer = new PptxViewer(host, {
        mode,
        scale,
        keyboard: true,
        showProgress: false,
        dir: ctx.rtl ? "rtl" : "ltr",
        slideshow: { nav: false, showSlideNumber: false, transition: "fade", ...(opts.viewerOptions?.slideshow as object | undefined) },
        ...(opts.viewerOptions ?? {}),
      });
      offs.push(
        viewer.on("progress", ({ ratio }: { ratio: number }) => ctx.progress(ratio)),
        viewer.on("slidechange", ({ index }: { index: number }) => {
          current = index;
          ctx.update();
        }),
        viewer.on("warning", ({ warning }: { warning: Error }) => ctx.warn(warning?.message ?? String(warning), warning)),
      );
      try {
        await viewer.load(ctx.file.bytes);
      } catch (err) {
        const e = err as { code?: string; message?: string };
        if (ctx.signal.aborted) throw new OfficeError("ABORTED", "Loading was aborted", err);
        throw new OfficeError("PARSE_ERROR", `The presentation could not be read: ${e?.message ?? err}`, err);
      }
      host.addEventListener("scroll", onScroll, { passive: true });
      search = new TextSearch(host);

      modeBtn = ctx.toolbar.button({ icon: "slideshow", label: ctx.t("slideshow"), pressed: mode === "slideshow", onClick: () => setMode(mode === "slideshow" ? "list" : "slideshow") });
      playBtn = ctx.toolbar.button({
        icon: "play",
        label: ctx.t("play"),
        onClick: () => {
          if (viewer.playing) viewer.pause();
          else viewer.play();
          const playing = !!viewer.playing;
          playBtn!.replaceChildren(svg(playing ? ICONS.pause : ICONS.play));
          playBtn!.title = ctx.t(playing ? "pause" : "play");
          playBtn!.setAttribute("aria-label", playBtn!.title);
          ctx.toolbar.setPressed(playBtn!, playing);
        },
      });
      playBtn.hidden = mode !== "slideshow";
      ctx.setStatus(`${slideCount()} ${ctx.t("slide").toLowerCase()}${slideCount() === 1 ? "" : "s"}`);
    },
    destroy() {
      cancelAnimationFrame(scrollRaf);
      host.removeEventListener("scroll", onScroll);
      offs.forEach((off) => off?.());
      search?.clear();
      try {
        viewer?.destroy();
      } catch {
        /* ignore */
      }
      viewer = null;
      host.remove();
    },
    getPageCount: slideCount,
    getPage: () => (mode === "slideshow" ? (viewer?.currentIndex ?? 0) : current) + 1,
    setPage(n) {
      const i = Math.max(0, Math.min(slideCount() - 1, n - 1));
      current = i;
      if (mode === "slideshow") viewer.goTo(i);
      else viewer.getSlideElement(i)?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    getZoom: () => (viewer ? Math.round(viewer.scale * 100) / 100 : 1),
    setZoom(z: number | ZoomPreset) {
      scale = z === "page-width" || z === "auto" ? "fit" : z === "page-fit" ? "contain" : z === "page-actual" ? 1 : z;
      viewer.setOptions({ scale });
    },
    zoomPresets: ["page-width", "page-fit", "page-actual"],
    onResize() {
      ctx.update();
    },
    onFullscreenChange(fs) {
      if (fs && mode !== "slideshow") setMode("slideshow");
    },
    onKeyDown(e) {
      if (mode !== "slideshow") return false;
      const fwd = ctx.rtl ? "ArrowLeft" : "ArrowRight";
      const back = ctx.rtl ? "ArrowRight" : "ArrowLeft";
      if (e.key === fwd || e.key === " " || e.key === "PageDown") viewer.next();
      else if (e.key === back || e.key === "PageUp") viewer.prev();
      else if (e.key === "Home") viewer.first();
      else if (e.key === "End") viewer.last();
      else return false;
      e.preventDefault();
      return true;
    },
    search(q, o) {
      if (mode === "slideshow") setMode("list");
      return search!.find(q, o);
    },
    searchNext: () => search!.next(),
    searchPrevious: () => search!.previous(),
    clearSearch: () => search?.clear(),
    async print() {
      const res = viewer?.result;
      if (!res) return;
      search?.clear();
      const pages = res.slides.map((s: { html: string }) => `<div class="oth-print-page oth-print-slide">${s.html}</div>`).join("");
      const css = `${lib.BASE_CSS ?? ""}\n${res.css ?? ""}
        .oth-print-slide{position:relative;overflow:hidden;display:block}
        .oth-print-slide>.slide{position:relative!important;margin:0 auto!important;transform-origin:top left}`;
      // PPTXjs output is generated by the library itself (escaped text, sanitised URLs).
      await printDocument({ content: `<div class="pptxjs">${pages}</div>`, css, title: ctx.file.name, pageSize: "landscape", margin: "0" });
    },
    async getText() {
      return host.innerText ?? host.textContent ?? "";
    },
  };
}
