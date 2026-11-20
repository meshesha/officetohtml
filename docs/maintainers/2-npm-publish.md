# 2. Publishing @meshesha/officetohtml to npm

Status (checked 2026-11-20):

- The name **`@meshesha/officetohtml` is free** on npm.
- Your npm account `meshesha` already owns the **`@meshesha` scope** (it publishes `@meshesha/pptxjs`),
  so no new organisation or scope is needed.
- `package.json` is ready: `name`, `version 2.0.0`, `exports` for every entry point, `files`
  (only `dist`, README, LICENSE, CHANGELOG, THIRD_PARTY_NOTICES), and
  `"publishConfig": { "access": "public" }` – needed because scoped packages are **private by default**.
- `prepublishOnly` runs typecheck, tests and the build automatically before every publish.

Publish **after** v2 is merged into `master` (see `1-git-commit-process.md`), from an up-to-date `master`.

---

## One-time setup

### 1. Log in

```powershell
npm whoami
```

If it prints `meshesha` you are logged in. Otherwise:

```powershell
npm login
```

This opens the browser to sign in to npmjs.com (use the account that owns `@meshesha/pptxjs`).

### 2. Two-factor authentication (recommended)

On npmjs.com → your avatar → **Account → Two-Factor Authentication** → enable
**"Authorization and writes"**. `npm publish` will then ask for a one-time code from your
authenticator app.

---

## Publishing a release

### 1. Clean, current checkout

```powershell
cd E:\projects\js\officetohtml
```

```powershell
git switch master; git pull; git status
```

`git status` must say *nothing to commit*.

### 2. Fresh install (uses the lockfile)

```powershell
npm ci
```

### 3. Preview exactly what will be uploaded

```powershell
npm pack --dry-run
```

Check the list: only `dist/…`, `README.md`, `LICENSE`, `CHANGELOG.md`, `THIRD_PARTY_NOTICES.md`,
`package.json`. Expected size ≈ 530 kB packed / 1.8 MB unpacked (mostly source maps).

Optional – test the real package in another project before publishing:

```powershell
npm pack
```

This creates `meshesha-officetohtml-2.0.0.tgz`; in a test project run
`npm install E:\projects\js\officetohtml\meshesha-officetohtml-2.0.0.tgz` and try it. Delete the
`.tgz` afterwards (do not commit it).

### 4. Publish

```powershell
npm publish
```

What happens:
1. `prepublishOnly` → `npm run typecheck`, `npm test`, `npm run build` (publish stops if anything fails);
2. upload as a **public** package (from `publishConfig`);
3. with 2FA npm asks for your one-time code.

First time only, if npm still complains about a private package, run `npm publish --access public`.

### 5. Verify

```powershell
npm view @meshesha/officetohtml version
```

- Page: https://www.npmjs.com/package/@meshesha/officetohtml
- CDN (may take a few minutes): https://cdn.jsdelivr.net/npm/@meshesha/officetohtml@2/dist/officetohtml.umd.js
- Quick test in an empty folder:

```powershell
mkdir $env:TEMP\oth-test; cd $env:TEMP\oth-test; npm init -y; npm install @meshesha/officetohtml
```

### 6. Tag the release in git

```powershell
git tag -a v2.0.0 -m "officeToHtml v2.0.0"; git push origin v2.0.0
```

Then create a GitHub Release for the tag with the CHANGELOG entry.

---

## Later releases

1. Update `CHANGELOG.md`.
2. Bump the version – **in two places**: `package.json` *and* `VERSION` in `src/core/versions.ts`
   (a unit test fails if they differ):

```powershell
npm version patch --no-git-tag-version
```

   (`patch` = 2.0.1 bug fixes, `minor` = 2.1.0 new features, `major` = 3.0.0 breaking changes.)
   Then edit `src/core/versions.ts` to the same number.
3. Commit, PR, merge (see the git guide), then repeat "Publishing a release" steps 1–6.

**Pre-releases** (for testers, not installed by default):

```powershell
npm version 2.1.0-beta.0 --no-git-tag-version
```

```powershell
npm publish --tag beta
```

Users install it with `npm install @meshesha/officetohtml@beta`.

---

## Notes and gotchas

- **SheetJS dependency.** `xlsx` is a URL dependency
  (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`) because the `xlsx` package on the npm
  registry is stuck at the vulnerable 0.18.5. This is SheetJS's officially recommended way. npm
  accepts it; users' `npm install` downloads it from cdn.sheetjs.com. Mention this in the README if
  users behind strict proxies report install problems.
- **`.npmrc` (`legacy-peer-deps=true`)** is only used inside this repository for development; it is
  not published and does not affect users.
- **Mistakes:** you can't overwrite a published version. Within 72 hours you may
  `npm unpublish @meshesha/officetohtml@2.0.0` (the version number can never be reused), but it is
  usually better to publish a fixed patch version and deprecate the bad one:
  `npm deprecate @meshesha/officetohtml@2.0.0 "Please use 2.0.1"`.
- **Old v1 users** never got an npm package, so there is nothing to deprecate. Point them to the
  migration guide.
- **Automating later (optional).** You can publish from GitHub Actions with npm "trusted
  publishing" (OIDC, no token stored): npmjs.com → package → **Settings → Trusted publishers** →
  add GitHub `meshesha/officetohtml` and a workflow file, then a workflow that runs `npm publish`
  on new GitHub releases. Not set up yet; ask if you want the workflow.
