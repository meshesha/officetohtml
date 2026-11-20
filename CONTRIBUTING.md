# Contributing

Thanks for helping! Bug reports, translations, documentation and code are all welcome.

* **Bugs:** open an issue with the browser, the OfficeToHtml version and – if possible – the file
  (or a minimal file that shows the problem). For rendering problems of Word, PowerPoint or PDF files,
  check whether mammoth.js / PPTXjs / PDF.js shows the same problem.
* **Security issues:** please report privately, see [SECURITY.md](SECURITY.md).
* **Translations:** add a language to `src/core/i18n.ts` (the tests check that all keys and
  placeholders are present).

## Development

```bash
npm install
npm run dev        # playground with sample files
npm test           # Vitest (unit + jsdom)
npm run lint && npm run typecheck
npm run build
```

Read the [developer guide](docs/developer-guide.md) for the architecture and the security rules
(never put file content into `innerHTML` without the sanitizer).

Pull requests should include tests and, for user-visible changes, documentation
(`officetohtml.js.org/pages/docs.html`, `docs/api.md`) and a `CHANGELOG.md` entry.
