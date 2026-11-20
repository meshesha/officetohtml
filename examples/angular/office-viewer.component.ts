/**
 * Standalone Angular wrapper for OfficeToHtml – copy this file into your app.
 *
 *   <app-office-viewer [src]="file" [options]="{ theme: 'auto' }" style="display:block;height:600px"
 *                      (loaded)="onLoad($event)" (failed)="onError($event)"></app-office-viewer>
 *
 * Works with Angular 16+ (standalone components, signals not required).
 */
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { OfficeViewer, type LoadResult, type OfficeError, type OfficeSource, type OfficeViewerOptions } from "@meshesha/officetohtml";

@Component({
  selector: "app-office-viewer",
  standalone: true,
  template: `<div #host style="height:100%"></div>`,
  styles: [":host{display:block;height:600px}"],
})
export class OfficeViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** URL, File, Blob or ArrayBuffer. */
  @Input() src: OfficeSource | null = null;
  @Input() fileName?: string;
  /** Read when the component is created. */
  @Input() options: OfficeViewerOptions = {};
  @Output() loaded = new EventEmitter<LoadResult>();
  @Output() failed = new EventEmitter<OfficeError>();
  @Output() pageChange = new EventEmitter<{ page: number; total: number }>();

  @ViewChild("host", { static: true }) host!: ElementRef<HTMLElement>;

  /** The underlying viewer (zoom, print, search …). */
  viewer: OfficeViewer | null = null;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    // Run outside Angular so pointer/scroll handlers don't trigger change detection.
    this.zone.runOutsideAngular(() => {
      this.viewer = new OfficeViewer(this.host.nativeElement, { height: "100%", ...this.options });
      this.viewer.on("load", (r) => this.zone.run(() => this.loaded.emit(r)));
      this.viewer.on("error", ({ error }) => this.zone.run(() => this.failed.emit(error)));
      this.viewer.on("pagechange", (p) => this.zone.run(() => this.pageChange.emit(p)));
    });
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes["src"] || changes["fileName"]) && this.viewer) this.load();
    if (changes["options"] && !changes["options"].firstChange && this.options.theme) this.viewer?.setTheme(this.options.theme);
  }

  ngOnDestroy(): void {
    this.viewer?.destroy();
    this.viewer = null;
  }

  private load(): void {
    if (!this.viewer) return;
    if (this.src) this.zone.runOutsideAngular(() => this.viewer!.load(this.src!, { fileName: this.fileName }).catch(() => undefined));
    else this.viewer.close();
  }
}
