# Doc Master

**55+ document conversion tools — all in your browser, files never leave your device.**

![Next.js](https://img.shields.io/badge/Next.js-16.2-000?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### 📄 PDF Tools
Merge, split, compress, rotate, reorder (drag & drop), delete pages, extract pages, crop, add page numbers, watermark, header/footer, protect, unlock, sign, flatten, repair, compare, PDF/A conversion, redact, fill forms — 20 tools.

### 🔄 From PDF
PDF to Word, Excel, PowerPoint, JPG, PNG, Text, HTML, SVG, OCR — 9 tools.

### 📝 To PDF
Word, Excel, PowerPoint, JPG, PNG, Text, HTML, SVG, Markdown to PDF — 9 tools.

### 📊 Document Conversion
Word ↔ Excel, Word → PowerPoint, HTML → Word, CSV → Excel, Excel → CSV, HTML ↔ Markdown, Image → Word/Excel/Text — 11 tools.

### 🖼️ Image Tools
Resize, compress, crop, convert format — 4 tools.

### 🔧 Utilities
Word counter, QR code generator — 2 tools.

### 🎯 Highlights
- **100% Client-Side** — Files never leave your device. No uploads, no servers, no privacy concerns.
- **Drag & Drop Reorder** — Rearrange PDF pages visually with @dnd-kit.
- **Real-Time Progress** — Progress bars with cancel/abort support for long operations.
- **Batch Processing** — Split PDFs, convert multiple files at once.
- **File Previews** — Thumbnail previews for images, inline previews for text/PDF/HTML.
- **PWA Ready** — Install as a standalone app with offline support.
- **Dark Mode** — Auto-detects system preference, toggle anytime.
- **Mobile Responsive** — Works on all screen sizes.
- **No Account Required** — Free and open source.

---

## 🚀 Live Demo

**[docmaster-five.vercel.app](https://docmaster-five.vercel.app)**

---

## 🛠️ Tech Stack

| Technology | Version |
|-----------|---------|
| [Next.js](https://nextjs.org/) | 16.2 |
| [React](https://react.dev/) | 19 |
| [TypeScript](https://www.typescriptlang.org/) | 5 |
| [Tailwind CSS](https://tailwindcss.com/) | 4 |
| [shadcn/ui](https://ui.shadcn.com/) | 4 |
| [@base-ui/react](https://base-ui.com/) | 1.5 |
| [pdf-lib](https://pdf-lib.js.org/) | 1.17 |
| [pdfjs-dist](https://mozilla.github.io/pdf.js/) | 6.0 |
| [tesseract.js](https://tesseract.projectnaptha.com/) | 7.0 |
| [jsPDF](https://github.com/parallax/jsPDF) | 4.2 |
| [Jimp](https://jimp-dev.github.io/jimp/) | 1.6 |
| [@dnd-kit](https://dndkit.com/) | 6.3 |
| [Lucide Icons](https://lucide.dev/) | latest |

---

## 🏃‍♂️ Run Locally

```bash
# Clone the repository
git clone https://github.com/MdDanishAlam7700/docmaster.git "Doc Master"
cd "Doc Master"

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── tools/              # 59 individual tool pages
│   └── page.tsx            # Landing page with search
├── components/
│   ├── converter/          # Shared components (FileUploader, ResultPanel, ToolPageTemplate, PageThumbnailList)
│   ├── layout/             # Header, Sidebar
│   └── ui/                 # shadcn/ui primitives (button, card, input, dialog, etc.)
├── lib/
│   ├── converters/         # Core conversion logic (index.ts, docx-converter, excel-converter, image-converter)
│   ├── tools-data.ts       # Tool definitions and metadata
│   ├── types.ts            # Shared TypeScript types
│   └── utils.ts            # Utility functions
└── hooks/                  # React hooks (useTheme)
```

---

## 🌐 Deployment

The app is deployed on **Vercel** — every push to `main` auto-deploys.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MdDanishAlam7700/docmaster)

---

## 📝 License

[MIT](LICENSE) © 2026 Md Danish Alam

---

## 🙏 Acknowledgments

- [ilovepdf.com](https://www.ilovepdf.com) — inspiration
- [123apps.com](https://123apps.com) — inspiration
- All the open-source libraries that make this possible

---

**Made by Danish**

