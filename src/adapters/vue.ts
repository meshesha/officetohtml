/**
 * Vue 3 component.
 *
 * ```vue
 * <script setup>
 * import { OfficeViewer } from "@meshesha/officetohtml/vue";
 * </script>
 * <template>
 *   <OfficeViewer src="/files/sheet.xlsx" :options="{ theme: 'auto' }" style="height:600px" @load="onLoad" />
 * </template>
 * ```
 * Or register globally: `app.use(OfficeToHtmlPlugin)`.
 * The component exposes `viewer` (template ref → `ref.value.viewer`).
 */
import { defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef, watch, type App, type PropType } from "vue";
import { OfficeViewer as Viewer } from "../core/viewer";
import type { OfficeSource } from "../core/source";
import type { OfficeViewerOptions } from "../types";

export const OfficeViewer = defineComponent({
  name: "OfficeViewer",
  props: {
    src: { type: [String, Object] as PropType<OfficeSource | null>, default: null },
    fileName: { type: String, default: undefined },
    type: { type: String, default: undefined },
    options: { type: Object as PropType<OfficeViewerOptions>, default: () => ({}) },
  },
  emits: ["load", "error", "pagechange", "zoomchange"],
  setup(props, { emit, expose }) {
    const host = ref<HTMLElement | null>(null);
    const viewer = shallowRef<Viewer | null>(null);

    const load = () => {
      const v = viewer.value;
      if (!v) return;
      if (props.src) v.load(props.src, { fileName: props.fileName, type: props.type }).catch(() => undefined);
      else v.close();
    };

    onMounted(() => {
      const v = new Viewer(host.value!, { height: "100%", ...props.options });
      v.on("load", (r) => emit("load", r));
      v.on("error", ({ error }) => emit("error", error));
      v.on("pagechange", (p) => emit("pagechange", p));
      v.on("zoomchange", ({ zoom }) => emit("zoomchange", zoom));
      viewer.value = v;
      load();
    });

    watch(() => [props.src, props.fileName, props.type], load);

    watch(
      () => props.options?.theme,
      (theme) => theme && viewer.value?.setTheme(theme),
    );

    onBeforeUnmount(() => {
      viewer.value?.destroy();
      viewer.value = null;
    });

    expose({ viewer });
    return () => h("div", { ref: host, style: { height: "600px" } });
  },
});

/** `app.use(OfficeToHtmlPlugin)` registers `<OfficeViewer>` globally. */
export const OfficeToHtmlPlugin = {
  install(app: App) {
    app.component("OfficeViewer", OfficeViewer);
  },
};

export { Viewer as OfficeViewerCore };
export type { OfficeViewerOptions };
