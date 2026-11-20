/**
 * React component.
 *
 * ```tsx
 * import { OfficeViewer } from "@meshesha/officetohtml/react";
 *
 * <OfficeViewer src="/files/report.docx" options={{ theme: "auto" }} style={{ height: 600 }}
 *               onLoad={({ file }) => console.log(file.kind)} />
 * ```
 * The ref exposes the underlying viewer instance (zoom, print, search ...).
 */
import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type ForwardedRef } from "react";
import { OfficeViewer as Viewer } from "../core/viewer";
import type { OfficeError } from "../errors";
import type { OfficeSource } from "../core/source";
import type { LoadResult, OfficeViewerOptions, ViewerEvents } from "../types";

export interface OfficeViewerProps {
  /** URL, File, Blob, ArrayBuffer or typed array. Changing it loads the new file. */
  src?: OfficeSource | null;
  /** File name / type hints (useful for Blob or ArrayBuffer sources). */
  fileName?: string;
  type?: string;
  /** Viewer options; read when the component mounts (`key` it to re-create). */
  options?: OfficeViewerOptions;
  className?: string;
  style?: CSSProperties;
  onLoad?: (result: LoadResult) => void;
  onError?: (error: OfficeError) => void;
  onPageChange?: (page: number, total: number) => void;
  onZoomChange?: (zoom: number) => void;
}

export const OfficeViewer = forwardRef(function OfficeViewer(props: OfficeViewerProps, ref: ForwardedRef<Viewer | null>) {
  const host = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const cb = useRef(props);
  cb.current = props;

  useEffect(() => {
    const v = new Viewer(host.current!, { height: "100%", ...props.options });
    const offs = [
      v.on("load", (r: ViewerEvents["load"]) => cb.current.onLoad?.(r)),
      v.on("error", ({ error }) => cb.current.onError?.(error)),
      v.on("pagechange", ({ page, total }) => cb.current.onPageChange?.(page, total)),
      v.on("zoomchange", ({ zoom }) => cb.current.onZoomChange?.(zoom)),
    ];
    setViewer(v);
    return () => {
      offs.forEach((off) => off());
      v.destroy();
      setViewer(null);
    };
    // options are applied on mount only
  }, []);

  useEffect(() => {
    if (!viewer) return;
    if (props.src) viewer.load(props.src, { fileName: props.fileName, type: props.type }).catch(() => undefined);
    else viewer.close();
  }, [viewer, props.src, props.fileName, props.type]);

  useImperativeHandle(ref, () => viewer as Viewer, [viewer]);

  return createElement("div", { ref: host, className: props.className, style: { height: 600, ...props.style } });
});

export type { OfficeViewerOptions, LoadResult };
export { Viewer as OfficeViewerCore };
