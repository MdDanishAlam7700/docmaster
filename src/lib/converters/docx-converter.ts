import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import * as mammoth from 'mammoth';
import { ConversionResult } from '@/lib/types';
import { changeExtension } from '@/lib/utils';

export async function docxToHtml(file: File): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: bytes });
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    img { max-width: 100%; }
    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 12px; }
  </style>
</head>
<body>
${result.value}
</body>
</html>`;

  return {
    file: new Blob([html], { type: 'text/html' }),
    filename: changeExtension(file.name, 'html'),
    mimeType: 'text/html',
  };
}

export async function docxToText(file: File): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: bytes });

  return {
    file: new Blob([result.value], { type: 'text/plain' }),
    filename: changeExtension(file.name, 'txt'),
    mimeType: 'text/plain',
  };
}

export async function htmlToDocx(html: string, filename: string): Promise<ConversionResult> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const paragraphs: Paragraph[] = [];

  function processNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text })],
        }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const level = parseInt(tag[1]) - 1;
        paragraphs.push(new Paragraph({
          heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6][level],
          children: [new TextRun({ text: el.textContent || '', bold: true })],
        }));
      } else if (tag === 'p') {
        const runs: TextRun[] = [];
        el.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            runs.push(new TextRun({ text: child.textContent || '' }));
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childEl = child as HTMLElement;
            runs.push(new TextRun({
              text: childEl.textContent || '',
              bold: childEl.tagName === 'B' || childEl.tagName === 'STRONG',
              italics: childEl.tagName === 'I' || childEl.tagName === 'EM',
            }));
          }
        });
        if (runs.length > 0) {
          paragraphs.push(new Paragraph({ children: runs }));
        }
      } else if (tag === 'br') {
        paragraphs.push(new Paragraph({ children: [] }));
      } else {
        el.childNodes.forEach(processNode);
      }
    }
  }

  doc.body.childNodes.forEach(processNode);

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: doc.body.textContent || '' })],
    }));
  }

  const docx = new Document({
    sections: [{ children: paragraphs }],
  });

  const buffer = await Packer.toBuffer(docx);
  const uint8Array = new Uint8Array(buffer);
  return {
    file: new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    filename: changeExtension(filename, 'docx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
}

export async function textToDocx(text: string, filename: string): Promise<ConversionResult> {
  const lines = text.split('\n');
  const paragraphs = lines.map(line => new Paragraph({
    children: [new TextRun({ text: line })],
  }));

  const docx = new Document({
    sections: [{ children: paragraphs }],
  });

  const buffer = await Packer.toBuffer(docx);
  const uint8Array = new Uint8Array(buffer);
  return {
    file: new Blob([uint8Array], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    filename: changeExtension(filename, 'docx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
}

export async function textToHtml(text: string, filename: string): Promise<ConversionResult> {
  const lines = text.split('\n');
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${filename}</title>
<style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6;white-space:pre-wrap;}</style>
</head>
<body>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
</html>`;

  return {
    file: new Blob([html], { type: 'text/html' }),
    filename: changeExtension(filename, 'html'),
    mimeType: 'text/html',
  };
}
