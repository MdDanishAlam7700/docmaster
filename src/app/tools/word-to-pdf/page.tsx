'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

// ──────────────────────────────────────────────────────────────
// Mammoth converts DOCX→HTML correctly for structure but strips
// most visual styling (table borders, cell shading, column widths).
// We post-process the HTML to restore table presentation before
// handing it to html2pdf.js for rendering.
// ──────────────────────────────────────────────────────────────
function enhanceMammothHtml(rawHtml: string): string {
  // Wrap in a full document with print-friendly table styles
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Calibri, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.4;
    color: #000;
    background: #fff;
  }
  p { margin-bottom: 6pt; }
  h1 { font-size: 20pt; font-weight: bold; margin: 12pt 0 6pt; }
  h2 { font-size: 16pt; font-weight: bold; margin: 10pt 0 5pt; }
  h3 { font-size: 13pt; font-weight: bold; margin: 8pt 0 4pt; }
  h4, h5, h6 { font-size: 11pt; font-weight: bold; margin: 6pt 0 3pt; }

  /* ── Table restoration ─────────────────────────────────── */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 8pt 0;
    font-size: 10pt;
    table-layout: auto;
  }
  td, th {
    border: 1px solid #aaa;
    padding: 4pt 6pt;
    vertical-align: top;
    text-align: left;
  }
  th {
    background-color: #f0f0f0;
    font-weight: bold;
  }

  /* ── Lists ─────────────────────────────────────────────── */
  ul, ol {
    margin: 4pt 0 4pt 20pt;
    padding: 0;
  }
  li { margin-bottom: 2pt; }

  /* ── Images ────────────────────────────────────────────── */
  img { max-width: 100%; height: auto; display: block; margin: 6pt 0; }

  /* ── Page breaks ────────────────────────────────────────── */
  .page-break { page-break-before: always; break-before: page; }

  /* ── Preserve bold / italic from mammoth ────────────────── */
  strong, b { font-weight: bold; }
  em, i { font-style: italic; }
  u { text-decoration: underline; }
  s, strike { text-decoration: line-through; }
</style>
</head>
<body>
${rawHtml}
</body>
</html>`;
}

export default function WordToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const { docxToHtml } = await import('@/lib/converters/docx-converter');
    const { renderHtmlToPdf } = await import('@/lib/converters/html-to-pdf');

    // Get raw mammoth HTML (correct structure, minimal styling)
    const htmlResult = await docxToHtml(files[0].file);
    const rawHtml = await htmlResult.file.text();

    // Enhance with print-grade table styles and page structure
    const enhancedHtml = enhanceMammothHtml(rawHtml);

    return renderHtmlToPdf(enhancedHtml, files[0].name, {
      marginMm: 15,    // Word default is ~2.5cm (≈ 25mm) — use 15mm for tighter fit
      quality: 0.95,
      scale: 2,
    });
  };

  return (
    <ToolPageTemplate
      title="Word to PDF"
      description="Convert Word documents to PDF with tables, formatting, fonts, and layout preserved."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/msword': ['.doc'],
      }}
      onConvert={handleConvert}
    />
  );
}
