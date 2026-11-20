# Security policy

## Supported versions

| Version | Supported |
|---|---|
| 2.x | ✅ |
| 1.x (jQuery plugin) | ❌ – contains known vulnerabilities, please upgrade |

## Reporting a vulnerability

Please **do not** open a public issue. Use GitHub's private vulnerability reporting
(*Security → Report a vulnerability* on https://github.com/meshesha/officetohtml) and include a sample
file if possible. You will get an answer within a few days.

Vulnerabilities in the libraries OfficeToHtml uses (PDF.js, mammoth.js, SheetJS, Handsontable, PPTXjs,
DOMPurify) should also be reported to those projects.

## Hardening checklist for applications

* Self-host the libraries (`libs.urls`, `pdf.assetsBase`) instead of loading them from public CDNs.
* Use a Content Security Policy; set `injectStyles: false` (link `officetohtml.css`) and `nonce`.
* Limit `formats`, `maxFileSize` and `allowedProtocols` to what your application needs.
* Never pass user-controlled URLs from other origins without validating them on your server.

See [docs/security-audit.md](docs/security-audit.md) for the v2 audit.
