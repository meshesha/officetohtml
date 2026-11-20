/**
 * Versions of the third-party libraries this release was built and tested
 * with. They pin the default CDN URLs used by the `<script>` (UMD) build and
 * the PDF.js worker/asset URLs. A unit test keeps them in sync with
 * package.json.
 */
export const LIB_VERSIONS = {
  pdfjs: "6.5.438",
  mammoth: "1.13.0",
  xlsx: "0.20.3",
  handsontable: "18.1.2",
  pptxjs: "2.0.0",
} as const;

export const VERSION = "2.0.0";
