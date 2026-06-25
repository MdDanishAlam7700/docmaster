# Doc Master — Project Overview

## Stack
- Next.js 16.2 App Router + React 19
- TypeScript 5, Tailwind CSS 4, shadcn/ui v4, @base-ui/react
- 100% client-side document processing

## Key Directories
- `src/app/tools/` — 55+ individual tool pages
- `src/components/converter/` — ToolPageTemplate, FileUploader, ResultPanel, PageThumbnailList
- `src/components/layout/` — AppLayout, Header, Sidebar, ThemeToggle
- `src/components/ui/` — shadcn/ui primitives (built on @base-ui/react)
- `src/lib/converters/` — Core conversion logic (index.ts, docx-converter, excel-converter, image-converter, html-to-pdf)
- `src/hooks/useTheme.tsx` — Custom theme provider (not next-themes)

## Tools
55 tools across 6 categories: PDF Tools (20), From PDF (9), To PDF (9), Document Conversion (8), Image Tools (7), Utilities (2).

## Key Libraries
- pdf-lib, pdfjs-dist, jsPDF, html2pdf.js — PDF manipulation
- docx, mammoth — Word processing  
- exceljs, papaparse — Excel/CSV
- tesseract.js — OCR
- jimp — Image processing
- @dnd-kit — Drag-and-drop

## Git Constraints
* **NEVER stage, commit, or push `DEPLOY.md` to GitHub.** This file is specifically excluded from version control and must remain local to avoid exposing user/deployment secrets. Any operations must respect `.gitignore` constraints.

