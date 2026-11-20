/** Inline SVG icons (stroke style, 24x24, currentColor). Static, trusted markup. */
const icon = (d: string) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const ICONS = {
  open: icon('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1"/><path d="M3 7v11a2 2 0 0 0 2 2h13l3-8H7l-3 8"/>'),
  download: icon('<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>'),
  print: icon('<path d="M7 9V4h10v5"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v6H7z"/>'),
  fullscreen: icon('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  exitFullscreen: icon('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
  zoomIn: icon('<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M11 8v6M8 11h6"/>'),
  zoomOut: icon('<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/>'),
  fit: icon('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/>'),
  search: icon('<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>'),
  close: icon('<path d="M6 6l12 12M18 6L6 18"/>'),
  prev: icon('<path d="M15 6l-6 6 6 6"/>'),
  next: icon('<path d="M9 6l6 6-6 6"/>'),
  up: icon('<path d="M6 15l6-6 6 6"/>'),
  down: icon('<path d="M6 9l6 6 6-6"/>'),
  first: icon('<path d="M6 5v14M18 6l-7 6 7 6"/>'),
  last: icon('<path d="M18 5v14M6 6l7 6-7 6"/>'),
  rotateLeft: icon('<path d="M4 4v6h6"/><path d="M4.5 10A8 8 0 1 1 6 17"/>'),
  rotateRight: icon('<path d="M20 4v6h-6"/><path d="M19.5 10A8 8 0 1 0 18 17"/>'),
  flipH: icon('<path d="M12 3v18"/><path d="M8 7L3 12l5 5V7zM16 7l5 5-5 5V7z"/>'),
  flipV: icon('<path d="M3 12h18"/><path d="M7 8l5-5 5 5H7zM7 16l5 5 5-5H7z"/>'),
  reset: icon('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  sun: icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: icon('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  sidebar: icon('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>'),
  play: icon('<path d="M7 5l12 7-12 7z"/>'),
  pause: icon('<path d="M8 5v14M16 5v14"/>'),
  slideshow: icon('<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 20h8"/>'),
  grid: icon('<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>'),
  hand: icon('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5v-7a1.5 1.5 0 0 1 3 0V12M14 6.5a1.5 1.5 0 0 1 3 0V12M17 8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7L4.3 14a1.5 1.5 0 0 1 2.4-1.8L8 14"/>'),
  cursor: icon('<path d="M9 4h3M12 4h3M12 4v16M9 20h6"/>'),
  wrap: icon('<path d="M4 6h16M4 12h13a3 3 0 0 1 0 6h-4"/><path d="M15 16l-2 2 2 2M4 18h5"/>'),
  lineNumbers: icon('<path d="M10 6h10M10 12h10M10 18h10M4 5h1v3M4 12h2l-2 2h2M4 17h2v3H4"/>'),
  checker: icon('<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 12h16M12 4v16"/><path d="M4 4h8v8H4zM12 12h8v8h-8z" fill="currentColor" stroke="none" opacity=".35"/>'),
  more: icon('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'),
  file: icon('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
  alert: icon('<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.5"/>'),
  lock: icon('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  upload: icon('<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 20h14"/>'),
};

export type IconName = keyof typeof ICONS;

/** Big colored document-type badges for the empty / error states. */
export const KIND_COLORS: Record<string, string> = {
  pdf: "#d93025",
  docx: "#2b579a",
  pptx: "#c43e1c",
  sheet: "#217346",
  image: "#8e44ad",
  text: "#5f6368",
  unsupported: "#5f6368",
};
