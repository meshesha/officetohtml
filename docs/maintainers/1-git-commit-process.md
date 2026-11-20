# 1. Committing v2 to GitHub

Step by step, for Windows PowerShell, from `E:\projects\js\officetohtml`.

The v2 work is still uncommitted. `git status` shows about 730 entries: ~360 renames (the old site
moved into `officetohtml.js.org/`, v1 moved into `legacy/v1/`), ~335 deletions (the old 21 MB
`pages/include` libraries and template), and the new source, tests and docs.

Plan: work on a **`v2` branch**, open a **pull request** into `master`, check CI, then merge.
`master` stays untouched until you merge, so the live site keeps working meanwhile.

---

## Step 0 – Check before committing

```powershell
cd E:\projects\js\officetohtml
```

```powershell
npm test
```

```powershell
npm run typecheck; if ($?) { npm run lint }
```

Make sure nothing generated or private gets committed. These must **not** appear in `git status`
(they are in `.gitignore`): `node_modules/`, `dist/`, `coverage/`, `test/output/`,
`officetohtml.js.org/lib/`, `officetohtml.js.org/vendor/`.

```powershell
git status --short | Select-String -Pattern "node_modules|dist/|test/output|js.org/lib|js.org/vendor"
```

No output = good.

## Step 1 – Create the branch

```powershell
git switch -c v2
```

## Step 2 – Stage everything

```powershell
git add -A
```

Review what will be committed (summary, then the file list):

```powershell
git diff --cached --stat | Select-Object -Last 5
```

```powershell
git diff --cached --name-status | Select-String -NotMatch "^D|^R"
```

## Step 3 – Commit (one commit or several)

**Option A – one commit (simplest).** Use a here-string for a multi-line message:

```powershell
@'
officeToHtml v2.0.0: TypeScript rewrite without jQuery

- OfficeViewer: one Office-like viewer for docx, pptx, xlsx/ods/csv, pdf, images and text
- Latest PDF.js 6.5, SheetJS 0.20.3, Handsontable 18, PPTXjs v2, mammoth 1.13 (loaded on demand)
- New image viewer; print only the document; i18n (8 languages, RTL); light/dark themes
- Adapters: React, Vue 3, Angular, jQuery (v1 compatible), <office-viewer> Web Component
- Security fixes: sheet-name and docx-link XSS, vulnerable PDF.js/SheetJS/jQuery removed
- Tests (Vitest), CI and GitHub Pages workflows, new officetohtml.js.org website
- v1 plugin moved to legacy/v1, old site moved to officetohtml.js.org/

Fixes #1, #2, #7, #9, #10, #11, #15
'@ | git commit -F -
```

(The closing `'@` must be at the start of the line.)

> `Fixes #N` makes GitHub close those issues automatically **when the PR is merged into master**.
> Only list issues you want auto-closed (see `3-github-issue-responses.md`; you may prefer to close
> them by hand with a comment).

**Option B – several commits (nicer history).** Stage and commit in groups instead of `git add -A`:

```powershell
git add legacy officetohtml.js.org/CNAME; git commit -m "Move v1 plugin to legacy/v1 and website to officetohtml.js.org"
```

```powershell
git add package.json package-lock.json .npmrc .gitignore tsconfig*.json vite*.ts eslint.config.js src; git commit -m "Add OfficeToHtml v2 library (TypeScript, no jQuery)"
```

```powershell
git add test scripts demo; git commit -m "Add tests, demo playground and browser checks"
```

```powershell
git add officetohtml.js.org; git commit -m "Rebuild officetohtml.js.org for v2"
```

```powershell
git add -A; git commit -m "Add documentation, examples and CI workflows"
```

Check that nothing is left:

```powershell
git status
```

## Step 4 – Push the branch

```powershell
git push -u origin v2
```

## Step 5 – Open a pull request

On https://github.com/meshesha/officetohtml GitHub shows **"Compare & pull request"** for `v2`.
Or open https://github.com/meshesha/officetohtml/compare/master...v2 directly.

- Title: `officeToHtml v2.0.0`
- Description: paste the "Added / Changed / Security / Fixed" parts of `CHANGELOG.md`.
- The **CI** workflow (`.github/workflows/ci.yml`) runs typecheck, lint, tests and build on
  Node 20 and 22. Wait for the green check.

## Step 6 – Switch GitHub Pages to Actions (before merging)

The website now lives in `officetohtml.js.org/` and is built by a workflow, so Pages must deploy
from Actions instead of the branch root:

1. Repository → **Settings → Pages**
2. **Build and deployment → Source: GitHub Actions**
3. **Custom domain:** type `officetohtml.js.org`, click **Save**, wait for the DNS check to pass,
   then tick **Enforce HTTPS**. GitHub ignores the `CNAME` file when it deploys from Actions, so the
   domain must be set here. Removing the old root `CNAME` file also cleared this setting.
4. **Actions → Pages → Run workflow** (or push a commit) to deploy again.

> If you merge without doing this, Pages keeps serving the repository root, which no longer
> contains the site, and `officetohtml.js.org` shows a GitHub 404 page.
> The js.org entry (`"officetohtml": "meshesha.github.io/officetohtml"`) is already correct.
> No new repository and no js.org pull request are needed.

## Step 7 – Merge

In the PR click **Merge pull request** (or "Squash and merge" for one commit on master).
Then the **Pages** workflow runs; watch it under the **Actions** tab, then open
https://officetohtml.js.org/ and check the home, Demos and Docs pages.

Update your local copy:

```powershell
git switch master; git pull
```

```powershell
git branch -d v2
```

## Step 8 – Tag the release

```powershell
git tag -a v2.0.0 -m "officeToHtml v2.0.0"
```

```powershell
git push origin v2.0.0
```

Then on GitHub: **Releases → Draft a new release → tag v2.0.0**, title `v2.0.0`, paste the
CHANGELOG entry. Publish to npm at the same time (see `2-npm-publish.md`).

---

## Every-day process after v2

```powershell
git switch master; git pull
```

```powershell
git switch -c fix/short-description
```

Edit, then:

```powershell
npm test; if ($?) { npm run lint }
```

```powershell
git add -A; git commit -m "Fix: short description (#issue)"
```

```powershell
git push -u origin fix/short-description
```

Open a PR → CI green → merge → delete the branch.

**Commit message style:** short imperative first line (≤ 72 chars), e.g.
`Fix sheet tabs in RTL workbooks (#20)`, `Add Italian translation`, `Update PDF.js to 6.6`.
Add details after a blank line when needed.

## Undo / help

| Situation | Command |
|---|---|
| Unstage everything (keeps your files) | `git reset` |
| Fix the last commit message (not pushed yet) | `git commit --amend` |
| Add a forgotten file to the last commit (not pushed yet) | `git add file; git commit --amend --no-edit` |
| See what a commit changed | `git show --stat HEAD` |
| Throw away the v2 branch entirely (careful!) | `git switch master; git branch -D v2` |
