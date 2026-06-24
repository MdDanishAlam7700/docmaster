# Deployment Guide for AI Assistants

This document defines the exact workflow for building, committing, and deploying changes to the Doc Master project. Any AI assistant working on this codebase **must** follow this process step by step.

---

## 1. Project Context

| Property        | Value                                                              |
|-----------------|--------------------------------------------------------------------|
| Project Root    | `C:\Users\danis\OneDrive\Desktop\Codings\Document Tool\docmaster` |
| GitHub Repo     | `github.com/MdDanishAlam7700/docmaster` (public)                  |
| Live URL        | `https://docmaster-five.vercel.app`                                |
| Framework       | Next.js 16.2 + React 19 + Tailwind CSS v4 + shadcn/ui v4          |
| Package Manager | npm                                                                |

---

## 2. Before Making Any Changes

### 2.1. Read existing configuration

Check these files first to understand conventions:

```
CLAUDE.md        - AI behavior instructions
AGENTS.md        - Project context and current state
DEPLOY.md        - This file
package.json     - Dependencies and scripts
tsconfig.json    - TypeScript configuration
next.config.ts   - Next.js configuration
tailwind.config.ts - Tailwind configuration
```

### 2.2. Verify the current state

```powershell
# Always start from the project root
Set-Location -LiteralPath "C:\Users\danis\OneDrive\Desktop\Codings\Document Tool\docmaster"

# Check git status
git status

# Check recent commits
git log --oneline -5

# Check if the branch is up to date with origin
git branch -vv
```

---

## 3. Making Changes

### 3.1. Code conventions

- All processing must be **client-side only** (browser). Files are never uploaded to a server.
- `Buffer` is **NOT** available in the browser. Use `ArrayBuffer` / `Uint8Array` directly.
- Never use `innerHTML` — use `DOMParser` instead for HTML parsing.
- Never use `alert()` for errors — use inline state or shadcn toast components.
- Use `'use client'` directive for pages with browser-only code.
- All converter functions live in `src/lib/converters/`.
- All tool pages live in `src/app/tools/<tool-name>/page.tsx`.
- Shared components live in `src/components/converter/`.

### 3.2. After making changes, always build

```powershell
Set-Location -LiteralPath "C:\Users\danis\OneDrive\Desktop\Codings\Document Tool\docmaster"
npx next build
```

**Expected output:** Must show "Compiled successfully" with 0 TypeScript errors and list all 59 pages as `○ (Static) prerendered as static content`.

If the build fails:
1. Read the error messages carefully
2. Fix the reported issues
3. Rebuild until it passes

### 3.3. Review changes before committing

```powershell
git status
git diff --stat
git diff <file-path>   # Review individual file changes
```

---

## 4. Committing

### 4.1. Stage and commit

```powershell
git add -A
```

Write a meaningful commit message:
- First line: short summary (max 72 chars)
- Blank line
- Bullet points with file paths and specific changes

```powershell
git commit -m "Short summary of changes

- path/to/file: specific change made
- path/to/file2: another specific change
- path/to/file3: fix for X issue"
```

### 4.2. Push to GitHub

```powershell
git push
```

**Important:** If `git push` fails with a "RemoteException" or "NativeCommandError" in PowerShell, it likely still succeeded. Check the output — if it shows `xxxxxxx..yyyyyyy main -> main`, the push was successful.

---

## 5. Deploying to Vercel

### 5.1. Manual deployment

```powershell
vercel --prod --yes
```

### 5.2. Handling the alias

After deployment, the output should show:

```
▲ Aliased         https://docmaster-five.vercel.app
```

If the alias **does not** appear (e.g., output only shows "Production" URL), you must manually reassign it:

```powershell
# Find the latest production deployment
vercel list --prod

# Reassign the alias to the latest deployment URL
vercel alias set "https://<latest-deployment-url>.vercel.app" "docmaster-five.vercel.app"
```

### 5.3. Check deployment status

```powershell
vercel inspect docmaster-five.vercel.app --logs
```

Look for:
- "Compiled successfully" in build logs
- "Ready" status at the end

---

## 6. Critical: GitHub Actions (Do NOT add)

**The Vercel GitHub App integration is already installed and working.** It automatically deploys on every push to `main`. You can see its status check on GitHub:

```
Vercel: success - Deployment has completed
```

Do **NOT** create GitHub Actions workflow files for deployment. The file `.github/workflows/deploy.yml` was previously added and caused a GitHub notification failure because:
- It used a third-party action (`amondnet/vercel-action@v20`) that requires repo secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)
- These secrets are not configured in the GitHub repository
- The native Vercel GitHub App handles deployment automatically without needing any workflow file

**Rule:** Never create or restore `.github/workflows/*.yml` files for Vercel deployment.

---

## 7. Verification Checklist (run before publishing)

- [ ] `npx next build` passes with 0 TypeScript errors
- [ ] All 59 pages are generated as static content
- [ ] `git status` shows only intended files
- [ ] Commit message is descriptive and follows the format
- [ ] `git push` succeeded (check for `main -> main` in output)
- [ ] `vercel --prod --yes` deployed successfully
- [ ] Alias `docmaster-five.vercel.app` is pointing to the latest deployment
- [ ] Vercel GitHub check shows "success" status

---

## 8. Troubleshooting

### Build fails with TypeScript errors
```powershell
# Read the full build output to find all errors
npx next build 2>&1
# Fix each error and rebuild
```

### Deployment alias lost
```powershell
vercel alias ls | Select-String "docmaster-five"
vercel list --prod
vercel alias set "<latest-deployment-url>" "docmaster-five.vercel.app"
```

### Git push shows NativeCommandError
This is a PowerShell rendering issue. Check if the actual push succeeded by looking for `xxxxxxx..yyyyyyy main -> main` in the error output.

### GitHub notification about Vercel failure
Check if `.github/workflows/` exists and contains deploy files. If so, delete them — the native Vercel integration handles deployment, not GitHub Actions.
