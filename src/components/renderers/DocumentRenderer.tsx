'use client';

/**
 * DocumentRenderer
 *
 * Renders a Word document's content (from mammoth HTML) as a styled
 * A4-proportioned React component.  The component provides:
 *
 *  - Print-grade table CSS: borders, padding, column layout
 *  - Correct heading hierarchy (h1–h6 with proportional font sizes)
 *  - List indentation and markers
 *  - Image max-width clamping
 *  - Calibri/Arial font stack matching Word's defaults
 *
 * The component uses dangerouslySetInnerHTML for the mammoth body content
 * (which is already sanitised by mammoth's own sanitizer) combined with a
 * <style> block for isolation — no leaking of app Tailwind variables.
 *
 * Designed to be captured by renderCapture.captureComponent().
 */

import React from 'react';

// A4 at 96 dpi = 794 × 1123 px content area
const A4_WIDTH_PX = 754; // 794 minus typical side margins

const PRINT_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .doc-body {
    font-family: Calibri, 'Segoe UI', Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #000000;
    background: #ffffff;
    width: ${A4_WIDTH_PX}px;
    padding: 40px 50px;
  }

  /* ── Paragraphs ─────────────────────────────────────────────── */
  .doc-body p   { margin-bottom: 6pt; }
  .doc-body p:last-child { margin-bottom: 0; }

  /* ── Headings ──────────────────────────────────────────────── */
  .doc-body h1 { font-size: 20pt; font-weight: 700; margin: 14pt 0 6pt; }
  .doc-body h2 { font-size: 16pt; font-weight: 700; margin: 12pt 0 5pt; }
  .doc-body h3 { font-size: 13pt; font-weight: 700; margin: 10pt 0 4pt; }
  .doc-body h4 { font-size: 11pt; font-weight: 700; margin: 8pt 0 3pt; }
  .doc-body h5 { font-size: 10pt; font-weight: 700; margin: 6pt 0 3pt; }
  .doc-body h6 { font-size: 9pt;  font-weight: 700; margin: 5pt 0 2pt; }

  /* ── Lists ─────────────────────────────────────────────────── */
  .doc-body ul,
  .doc-body ol  { margin: 4pt 0 4pt 20pt; padding: 0; }
  .doc-body li  { margin-bottom: 2pt; }

  /* ── Tables ────────────────────────────────────────────────── */
  .doc-body table {
    border-collapse: collapse;
    width: 100%;
    margin: 8pt 0;
    font-size: 10pt;
    table-layout: auto;
    page-break-inside: avoid;
  }
  .doc-body td,
  .doc-body th {
    border: 1px solid #999999;
    padding: 4pt 6pt;
    vertical-align: top;
    text-align: left;
  }
  .doc-body th {
    background-color: #f0f0f0;
    font-weight: 700;
  }
  /* Zebra rows */
  .doc-body tr:nth-child(even) td { background-color: #fafafa; }

  /* ── Images ────────────────────────────────────────────────── */
  .doc-body img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 6pt 0;
  }

  /* ── Horizontal rule ────────────────────────────────────────── */
  .doc-body hr {
    border: none;
    border-top: 1px solid #cccccc;
    margin: 10pt 0;
  }

  /* ── Inline styles from mammoth ─────────────────────────────── */
  .doc-body strong, .doc-body b { font-weight: 700; }
  .doc-body em,     .doc-body i { font-style: italic; }
  .doc-body u  { text-decoration: underline; }
  .doc-body s,
  .doc-body strike { text-decoration: line-through; }

  /* ── Code / pre ─────────────────────────────────────────────── */
  .doc-body pre,
  .doc-body code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 9pt;
    background: #f5f5f5;
    border-radius: 3px;
    padding: 2px 4px;
  }
  .doc-body pre { padding: 8pt; white-space: pre-wrap; margin: 6pt 0; }

  /* ── Footnotes / small ─────────────────────────────────────── */
  .doc-body small { font-size: 8pt; }
`;

export interface DocumentRendererProps {
  /** Raw HTML body content from mammoth (NOT the full <html> document) */
  bodyHtml: string;
}

export function DocumentRenderer({ bodyHtml }: DocumentRendererProps) {
  return (
    <div style={{ background: '#ffffff', display: 'inline-block' }}>
      {/* Scoped styles — override any app theme without touching global CSS */}
      <style>{PRINT_CSS}</style>

      {/* mammoth output is already safe HTML (no scripts) */}
      <div
        className="doc-body"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </div>
  );
}
