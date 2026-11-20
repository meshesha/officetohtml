/** Viewer stylesheet. Also emitted as dist/officetohtml.css. */
export const VIEWER_CSS = `
.oth{
  --oth-bg:#f3f4f6;--oth-surface:#ffffff;--oth-surface-2:#f8f9fb;--oth-border:#e3e5e8;--oth-text:#1f2328;--oth-muted:#646b75;
  --oth-accent:#2563eb;--oth-accent-text:#ffffff;--oth-hover:rgba(15,23,42,.06);--oth-active:rgba(37,99,235,.12);
  --oth-paper:#ffffff;--oth-paper-text:#111;--oth-shadow:0 1px 3px rgba(15,23,42,.12),0 8px 24px rgba(15,23,42,.08);
  --oth-hit:#fde68a;--oth-hit-active:#f59e0b;--oth-radius:10px;--oth-font:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;
  position:relative;display:flex;flex-direction:column;box-sizing:border-box;width:100%;height:100%;min-height:400px;
  background:var(--oth-bg);color:var(--oth-text);font:14px/1.4 var(--oth-font);border:1px solid var(--oth-border);
  border-radius:var(--oth-radius);overflow:hidden;isolation:isolate;text-align:start;container:oth / inline-size
}
.oth[data-theme="dark"]{
  --oth-bg:#16181d;--oth-surface:#1f2228;--oth-surface-2:#262a31;--oth-border:#30353d;--oth-text:#e6e8eb;--oth-muted:#9aa1ab;
  --oth-accent:#60a5fa;--oth-accent-text:#0b1220;--oth-hover:rgba(255,255,255,.07);--oth-active:rgba(96,165,250,.18);
  --oth-paper:#ffffff;--oth-paper-text:#111;--oth-shadow:0 1px 3px rgba(0,0,0,.5),0 8px 24px rgba(0,0,0,.35);
  --oth-hit:#a16207;--oth-hit-active:#f59e0b;color-scheme:dark
}
.oth *,.oth *::before,.oth *::after{box-sizing:border-box}
.oth:fullscreen{border-radius:0;border:0;width:100vw;height:100vh}
.oth button,.oth input,.oth select{font:inherit;color:inherit}
.oth [hidden]{display:none!important}
.oth-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* toolbar */
.oth-toolbar{display:flex;align-items:center;gap:4px;padding:6px 8px;background:var(--oth-surface);border-bottom:1px solid var(--oth-border);
  min-height:46px;overflow-x:auto;scrollbar-width:none;flex:none}
.oth-toolbar::-webkit-scrollbar{display:none}
.oth-tb-group{display:flex;align-items:center;gap:2px;flex:none}
.oth-tb-spacer{flex:1 1 auto;min-width:4px}
.oth-tb-sep{width:1px;height:22px;background:var(--oth-border);margin:0 4px;flex:none}
.oth-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;min-width:32px;padding:0 7px;border:0;border-radius:7px;
  background:transparent;cursor:pointer;white-space:nowrap;transition:background .12s,color .12s}
.oth-btn:hover{background:var(--oth-hover)}
.oth-btn:focus-visible,.oth-input:focus-visible,.oth-select:focus-visible,.oth-tab:focus-visible{outline:2px solid var(--oth-accent);outline-offset:1px}
.oth-btn[aria-pressed="true"]{background:var(--oth-active);color:var(--oth-accent)}
.oth-btn:disabled{opacity:.4;cursor:default;background:transparent}
.oth-btn-primary{background:var(--oth-accent);color:var(--oth-accent-text)}
.oth-btn-primary:hover{background:var(--oth-accent);filter:brightness(1.08)}
.oth-file{display:flex;align-items:center;gap:8px;min-width:0;max-width:280px;padding:0 6px;flex:0 1 auto}
.oth-badge{flex:none}
.oth-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
.oth-badge{flex:none;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#fff;padding:3px 6px;border-radius:5px;background:var(--oth-muted)}
.oth-input,.oth-select{height:30px;border:1px solid var(--oth-border);border-radius:7px;background:var(--oth-surface-2);padding:0 8px;min-width:0}
.oth-page-input{width:52px;text-align:center}
.oth-muted{color:var(--oth-muted)}
.oth-zoom-select{width:96px}
.oth-page-label{white-space:nowrap;padding:0 4px;color:var(--oth-muted)}

/* search bar */
.oth-searchbar{display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--oth-surface);border-bottom:1px solid var(--oth-border);flex:none}
.oth-searchbar .oth-input{flex:0 1 280px}
.oth-search-count{min-width:70px;color:var(--oth-muted);font-size:12px}
.oth-check{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--oth-muted);cursor:pointer;user-select:none}

/* layout */
.oth-main{position:relative;display:flex;flex:1 1 auto;min-height:0}
.oth-sidebar{flex:none;width:200px;max-width:45%;overflow:auto;background:var(--oth-surface);border-inline-end:1px solid var(--oth-border)}
.oth-body{position:relative;flex:1 1 auto;min-width:0;overflow:hidden;outline:none}
.oth-content{position:absolute;inset:0;overflow:auto}
.oth-footer{display:flex;align-items:center;gap:8px;min-height:28px;padding:0 10px;background:var(--oth-surface);border-top:1px solid var(--oth-border);
  font-size:12px;color:var(--oth-muted);flex:none}
.oth-footer-tools{display:flex;align-items:stretch;align-self:stretch;min-width:0;flex:1 1 auto;overflow-x:auto;scrollbar-width:thin}
.oth-status{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none;max-width:60%}

/* overlays */
.oth-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;
  text-align:center;background:var(--oth-bg);z-index:5}
.oth-overlay-title{font-size:17px;font-weight:600}
.oth-overlay-text{color:var(--oth-muted);max-width:460px;overflow-wrap:anywhere}
.oth-overlay-icon{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#fff;background:var(--oth-muted)}
.oth-overlay-icon svg{width:32px;height:32px}
.oth-spinner{width:36px;height:36px;border-radius:50%;border:3px solid var(--oth-border);border-top-color:var(--oth-accent);animation:oth-spin .8s linear infinite}
.oth-progress{width:220px;height:4px;border-radius:2px;background:var(--oth-border);overflow:hidden}
.oth-progress>div{height:100%;width:0;background:var(--oth-accent);transition:width .15s}
.oth-progress[data-indeterminate]>div{width:35%;animation:oth-indet 1.1s ease-in-out infinite}
@keyframes oth-spin{to{transform:rotate(360deg)}}
@keyframes oth-indet{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
.oth-drop{position:absolute;inset:8px;border:2px dashed var(--oth-accent);border-radius:var(--oth-radius);background:var(--oth-active);
  display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--oth-accent);z-index:20;pointer-events:none}
.oth-dialog{background:var(--oth-surface);border:1px solid var(--oth-border);border-radius:12px;box-shadow:var(--oth-shadow);padding:20px;width:min(340px,100%);
  display:flex;flex-direction:column;gap:10px;text-align:start}
.oth-dialog-actions{display:flex;gap:8px;justify-content:flex-end}
.oth-error-text{color:#dc2626;font-size:12px}

/* search hits */
.oth mark.oth-hit{background:var(--oth-hit);color:inherit;border-radius:2px}
.oth mark.oth-hit-active{background:var(--oth-hit-active);color:#000;outline:2px solid var(--oth-hit-active)}

/* docx */
.oth-docx{padding:24px 16px;min-height:100%}
.oth-docx-page{margin:0 auto;background:var(--oth-paper);color:var(--oth-paper-text);box-shadow:var(--oth-shadow);
  width:min(21cm,100%);min-height:29.7cm;padding:2.2cm 2.4cm;font:11pt/1.5 Calibri,Carlito,"Segoe UI",Arial,sans-serif;overflow-wrap:break-word}
.oth-docx-flow .oth-docx-page{width:100%;min-height:0;box-shadow:none;padding:16px 24px;max-width:none}
.oth-docx-page img{max-width:100%;height:auto}
.oth-docx-page table{border-collapse:collapse;margin:8px 0;max-width:100%}
.oth-docx-page td,.oth-docx-page th{border:1px solid #bfbfbf;padding:4px 7px;vertical-align:top}
.oth-docx-page p{margin:0 0 8pt}
.oth-docx-page h1{font-size:20pt;color:#2f5496;font-weight:500;margin:12pt 0 6pt}
.oth-docx-page h2{font-size:16pt;color:#2f5496;font-weight:500;margin:10pt 0 5pt}
.oth-docx-page h3{font-size:13pt;color:#1f3763;font-weight:500;margin:8pt 0 4pt}
.oth-docx-page h4,.oth-docx-page h5,.oth-docx-page h6{color:#2f5496;margin:8pt 0 4pt}
.oth-docx-page a{color:#0563c1}
.oth-docx-page ul,.oth-docx-page ol{margin:0 0 8pt;padding-inline-start:28px}
.oth-docx-page blockquote{margin:8pt 24pt;color:#404040;font-style:italic}
.oth-docx-page sup a{text-decoration:none}

/* sheets */
.oth-sheet{position:absolute;inset:0;display:flex;flex-direction:column}
.oth-formula{display:flex;align-items:center;gap:6px;padding:4px 8px;background:var(--oth-surface);border-bottom:1px solid var(--oth-border);flex:none}
.oth-formula-cell{width:84px;flex:none;text-align:center;font-weight:600}
.oth-formula-fx{font-style:italic;font-family:Georgia,serif;color:var(--oth-muted);padding:0 4px}
.oth-formula-value{flex:1 1 auto;min-width:0}
.oth-grid{position:relative;flex:1 1 auto;min-height:0;overflow:hidden}
.oth-grid-table{position:absolute;inset:0;overflow:auto;background:var(--oth-surface)}
.oth-tab{display:inline-flex;align-items:center;padding:0 14px;border:0;border-inline-end:1px solid var(--oth-border);background:transparent;cursor:pointer;
  white-space:nowrap;color:var(--oth-muted);font-size:12px;border-top:2px solid transparent;min-height:28px}
.oth-tab:hover{background:var(--oth-hover)}
.oth-tab[aria-selected="true"]{color:var(--oth-text);background:var(--oth-bg);border-top-color:#217346;font-weight:600}
table.oth-table{border-collapse:separate;border-spacing:0;font-size:13px;background:var(--oth-surface)}
table.oth-table th,table.oth-table td{border-inline-end:1px solid var(--oth-border);border-bottom:1px solid var(--oth-border);padding:3px 8px;white-space:pre;max-width:420px;
  overflow:hidden;text-overflow:ellipsis;height:24px}
table.oth-table thead th{position:sticky;top:0;background:var(--oth-surface-2);z-index:2;font-weight:500;color:var(--oth-muted);text-align:center}
table.oth-table tbody th{position:sticky;inset-inline-start:0;background:var(--oth-surface-2);z-index:1;font-weight:400;color:var(--oth-muted);text-align:center;min-width:44px}
table.oth-table thead th:first-child{inset-inline-start:0;z-index:3}
table.oth-table td.oth-num{text-align:end}
table.oth-table td.oth-selected{outline:2px solid #217346;outline-offset:-2px}
.oth-notice{padding:6px 10px;font-size:12px;color:var(--oth-muted)}

/* images */
.oth-image-stage{position:absolute;inset:0;overflow:hidden;touch-action:none;cursor:grab;user-select:none}
.oth-image-stage.oth-dragging{cursor:grabbing}
.oth-image-stage.oth-checker{background-color:#fff;background-image:linear-gradient(45deg,#d0d0d0 25%,transparent 25%),linear-gradient(-45deg,#d0d0d0 25%,transparent 25%),
  linear-gradient(45deg,transparent 75%,#d0d0d0 75%),linear-gradient(-45deg,transparent 75%,#d0d0d0 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0}
.oth-image{position:absolute;left:0;top:0;transform-origin:center center;max-width:none;max-height:none;image-rendering:auto;will-change:transform;-webkit-user-drag:none}
.oth-image.oth-pixelated{image-rendering:pixelated}

/* text */
.oth-text{min-height:100%;background:var(--oth-surface);font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  --oth-gutter:calc(var(--oth-digits,3) * 1ch + 22px)}
.oth-text-code{margin:0;padding:12px 16px;white-space:pre;tab-size:4;min-width:max-content;counter-reset:oth-line}
.oth-text.oth-wrap .oth-text-code{white-space:pre-wrap;overflow-wrap:anywhere;min-width:0}
.oth-line{display:block;unicode-bidi:plaintext;min-height:1.55em}
.oth-text:not(.oth-no-lines) .oth-text-code{padding-inline-start:0}
.oth-text:not(.oth-no-lines) .oth-line{padding-inline-start:calc(var(--oth-gutter) + 12px);position:relative}
.oth-text:not(.oth-no-lines) .oth-line::before{counter-increment:oth-line;content:counter(oth-line);position:absolute;inset-inline-start:0;width:var(--oth-gutter);
  padding-inline-end:10px;text-align:end;color:var(--oth-muted);background:var(--oth-surface-2);border-inline-end:1px solid var(--oth-border);height:100%;user-select:none;box-sizing:border-box}

/* pdf */
.oth-pdf{position:absolute;inset:0;overflow:auto;background:var(--oth-bg)}
.oth-pdf .pdfViewer{padding:12px 0}
.oth-pdf .pdfViewer .page{box-shadow:var(--oth-shadow);border:0;margin:12px auto}
.oth-pdf.oth-hand{cursor:grab}
.oth-pdf.oth-hand.oth-dragging{cursor:grabbing}
.oth-pdf.oth-hand .textLayer{pointer-events:none}
.oth[data-presentation] .oth-pdf{background:#000}
.oth[data-presentation] .oth-pdf .pdfViewer .page{box-shadow:none;margin:0 auto}
.oth-thumbs{display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px}
.oth-thumb{display:flex;flex-direction:column;align-items:center;gap:4px;border:0;background:transparent;cursor:pointer;padding:6px;border-radius:8px;font-size:12px;color:var(--oth-muted)}
.oth-thumb:hover{background:var(--oth-hover)}
.oth-thumb[aria-current="true"]{background:var(--oth-active);color:var(--oth-accent)}
.oth-thumb canvas,.oth-thumb-ph{display:block;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);width:120px}
.oth-thumb-ph{height:155px}
.oth-side-tabs{display:flex;gap:2px;padding:6px;border-bottom:1px solid var(--oth-border);position:sticky;top:0;background:var(--oth-surface);z-index:1}
.oth-side-tabs .oth-btn{flex:1;font-size:12px}
.oth-outline{list-style:none;margin:0;padding:6px 6px 6px 10px;font-size:13px}
.oth-outline ul{list-style:none;margin:0;padding-inline-start:14px}
.oth-outline a{display:block;padding:4px 6px;border-radius:6px;color:inherit;text-decoration:none}
.oth-outline a:hover{background:var(--oth-hover)}

/* pptx */
.oth-pptx{position:absolute;inset:0;overflow:auto}
.oth-pptx>.pptxjs{min-height:100%}

/* unsupported */
.oth-unsupported{position:absolute;inset:0}

@container oth (max-width:640px){
  .oth-file-name{display:none}
  .oth-file{flex:none;padding:0 2px}
  .oth-hide-sm{display:none!important}
  .oth-zoom-select{width:76px}
  .oth-sidebar{position:absolute;inset-block:0;inset-inline-start:0;z-index:6;box-shadow:var(--oth-shadow)}
  .oth-docx{padding:8px 0}
  .oth-docx-page{padding:1.2cm 1cm}
}
@container oth (max-width:420px){.oth-page-label{display:none}.oth-tools .oth-btn{min-width:28px;padding:0 4px}}
@media print{.oth-toolbar,.oth-footer,.oth-searchbar,.oth-sidebar{display:none!important}}
@media (prefers-reduced-motion:reduce){.oth *{transition:none!important;animation-duration:.01ms!important}}
`;
