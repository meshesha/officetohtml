# Framework integration

| Framework | Import | Notes |
|---|---|---|
| Vanilla / any | `@meshesha/officetohtml` | `new OfficeViewer(el, options)` |
| React ≥ 17 | `@meshesha/officetohtml/react` | `<OfficeViewer src options onLoad onError onPageChange onZoomChange ref />` |
| Vue ≥ 3.2 | `@meshesha/officetohtml/vue` | `<OfficeViewer :src :file-name :type :options @load @error @pagechange @zoomchange />`, `OfficeToHtmlPlugin` |
| Angular ≥ 16 | `@meshesha/officetohtml/angular` | `defineOfficeViewerElement()` + `<office-viewer>` (CUSTOM_ELEMENTS_SCHEMA), or the standalone wrapper in `examples/angular` |
| jQuery ≥ 1.12 | `@meshesha/officetohtml/jquery` | `installJQueryPlugin($)`; `$.fn.officeToHtml` (v1) and `$.fn.officeViewer` (v2). Auto-installed by the UMD bundle. |
| Web Components | `@meshesha/officetohtml/element` | `defineOfficeViewerElement(tag?)` → `<office-viewer>` |
| `<script>` | `dist/officetohtml.umd.js` | `window.OfficeToHtml` (+ element + jQuery plugin) |

Frameworks are optional peer dependencies – install only the one you use.

## React

```tsx
import { useRef, useState } from "react";
import { OfficeViewer } from "@meshesha/officetohtml/react";
import type { OfficeViewer as Core } from "@meshesha/officetohtml";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const ref = useRef<Core>(null);
  return (
    <>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button onClick={() => ref.current?.print()}>Print</button>
      <OfficeViewer ref={ref} src={file} options={{ theme: "auto" }} style={{ height: "80vh" }} />
    </>
  );
}
```

* `options` are read when the component mounts; give the component a new `key` to re-create it with other options.
* Changing `src` loads the new file; `src={null}` closes it.
* Next.js: use inside a `"use client"` component (or `dynamic(() => …, { ssr: false })`).

## Vue 3

```vue
<script setup lang="ts">
import { ref } from "vue";
import { OfficeViewer } from "@meshesha/officetohtml/vue";
const src = ref<string | File>("/files/report.docx");
const viewer = ref();            // viewer.value.viewer → OfficeViewer instance
</script>

<template>
  <input type="file" @change="src = ($event.target as HTMLInputElement).files![0]" />
  <OfficeViewer ref="viewer" :src="src" :options="{ locale: 'he' }" style="height:80vh" @error="console.error" />
</template>
```

Nuxt: wrap in `<ClientOnly>`.

## Angular

Option A – custom element (no wrapper code):

```ts
// main.ts
import { defineOfficeViewerElement } from "@meshesha/officetohtml/angular";
defineOfficeViewerElement();
```

```ts
@Component({
  standalone: true,
  selector: "app-preview",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<office-viewer [attr.src]="url" theme="auto" style="height:600px"
                (office-load)="onLoad($event)" (office-error)="onError($event)"></office-viewer>`,
})
export class PreviewComponent { url = "/assets/report.docx"; }
```

Set complex options or a `File` through the element: `@ViewChild` → `el.nativeElement.options = {…}` /
`el.nativeElement.source = file`.

Option B – the standalone component in [`examples/angular/office-viewer.component.ts`](../examples/angular/office-viewer.component.ts)
(copy it into your app): `<app-office-viewer [src]="file" [options]="{ theme: 'dark' }" (loaded)="…" />`.

## jQuery

```html
<script src="jquery.min.js"></script>
<script src="officetohtml.umd.js"></script>
<script>
  $("#viewer").officeViewer({ src: "files/demo.xlsx", sheet: { engine: "table" } });
  $("#viewer").officeViewer().on("pagechange", (e) => console.log(e.page));
</script>
```

## Web Component

```html
<office-viewer id="v" src="files/demo.pptx" locale="fr" theme="dark" height="600"></office-viewer>
<script>
  document.getElementById("v").addEventListener("office-load", (e) => console.log(e.detail.file.name));
</script>
```
