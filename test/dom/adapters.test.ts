// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, createRef, act } from "react";
import { createRoot } from "react-dom/client";
import { createApp, h as vh, nextTick, ref } from "vue";
import $ from "jquery";
import { OfficeViewer as ReactViewer } from "../../src/adapters/react";
import { OfficeViewer as VueViewer } from "../../src/adapters/vue";
import { defineOfficeViewerElement } from "../../src/adapters/element";
import { installJQueryPlugin } from "../../src/adapters/jquery";
import type { OfficeViewer } from "../../src/core/viewer";
import { enc, until } from "../helpers/fixtures";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const text = enc("hello adapters");

afterEach(() => {
  document.body.innerHTML = "";
});

describe("React", () => {
  it("mounts, loads, exposes the instance and cleans up", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const viewerRef = createRef<OfficeViewer>();
    const onLoad = vi.fn();
    await act(async () => {
      root.render(createElement(ReactViewer, { ref: viewerRef, src: text, fileName: "a.txt", onLoad, options: { theme: "dark" } }));
    });
    await until(() => onLoad.mock.calls.length);
    expect(viewerRef.current?.file?.name).toBe("a.txt");
    expect(host.querySelector(".oth")!.getAttribute("data-theme")).toBe("dark");
    expect(host.textContent).toContain("hello adapters");
    await act(async () => root.unmount());
    expect(host.querySelector(".oth")).toBeNull();
  });
});

describe("Vue", () => {
  it("mounts, emits load and reacts to src changes", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const src = ref<Uint8Array | null>(text);
    const onLoad = vi.fn();
    const app = createApp({ render: () => vh(VueViewer, { src: src.value, fileName: "a.txt", onLoad }) });
    app.mount(host);
    await until(() => onLoad.mock.calls.length);
    expect(host.textContent).toContain("hello adapters");
    src.value = enc("second file");
    await nextTick();
    await until(() => onLoad.mock.calls.length === 2);
    expect(host.textContent).toContain("second file");
    app.unmount();
    expect(host.querySelector(".oth")).toBeNull();
  });
});

describe("Web Component", () => {
  it("<office-viewer> loads from the source property and dispatches events", async () => {
    defineOfficeViewerElement();
    defineOfficeViewerElement(); // idempotent
    const el = document.createElement("office-viewer");
    el.setAttribute("theme", "dark");
    const loaded = vi.fn();
    el.addEventListener("office-load", loaded);
    el.source = text;
    el.setAttribute("file-name", "a.txt");
    document.body.appendChild(el);
    await until(() => loaded.mock.calls.length);
    expect(el.viewer?.file?.kind).toBe("text");
    expect(el.querySelector(".oth")!.getAttribute("data-theme")).toBe("dark");
    el.remove();
    expect(el.viewer).toBeNull();
  });
});

describe("jQuery", () => {
  it("v1 $.fn.officeToHtml and v2 $.fn.officeViewer", async () => {
    installJQueryPlugin($);
    const host = document.body.appendChild(document.createElement("div"));
    host.id = "res";
    const input = document.body.appendChild(document.createElement("input"));
    input.id = "select_file";
    input.type = "file";
    $("#res").officeToHtml({ inputObjId: "select_file", pdfSetting: { printBtn: false } });
    const viewer = $("#res").officeViewer() as OfficeViewer;
    expect(viewer).toBeDefined();
    expect(viewer.options.toolbar).toEqual({ print: false });
    const load = vi.spyOn(viewer, "load").mockResolvedValue(undefined as any);
    Object.defineProperty(input, "files", { value: [new File(["x"], "a.txt")] });
    input.dispatchEvent(new Event("change"));
    expect(load).toHaveBeenCalled();

    $("#res").officeViewer({ theme: "dark" });
    const v2 = $("#res").officeViewer() as OfficeViewer;
    expect(v2).not.toBe(viewer);
    expect(v2.element.getAttribute("data-theme")).toBe("dark");
    expect(host.querySelectorAll(".oth").length).toBe(1);
  });
});
