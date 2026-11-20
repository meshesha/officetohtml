/*
 * Site configuration for OfficeToHtml: use the self-hosted copies of the
 * third-party libraries in /vendor (copied by scripts/build-site.mjs) instead
 * of public CDNs. Every page includes this before creating a viewer.
 */
(function () {
  "use strict";
  var base = document.querySelector('meta[name="site-root"]');
  var root = new URL(base ? base.getAttribute("content") : "./", document.baseURI);
  var v = function (p) { return new URL("vendor/" + p, root).href; };
  window.OTH_SITE = {
    root: root.href,
    libs: {
      urls: {
        pdfjs: v("pdfjs/build/pdf.min.mjs"),
        pdfjsViewer: v("pdfjs/web/pdf_viewer.mjs"),
        mammoth: v("mammoth/mammoth.browser.min.js"),
        xlsx: v("xlsx/xlsx.full.min.js"),
        handsontable: v("handsontable/handsontable.full.min.js"),
        pptxjs: v("pptxjs/pptxjs.umd.js"),
      },
    },
    pdf: { assetsBase: v("pdfjs/") },
  };
})();
