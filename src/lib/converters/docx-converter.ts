import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType } from 'docx';
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

interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  color?: string;
  bgColor?: string;
  fontSize?: string;
  fontFamily?: string;
  align?: string;
  valign?: string;
  borderTop?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRight?: string;
}

function parseStyle(style: string): CellStyle {
  const s: CellStyle = {};
  if (!style) return s;
  const props = style.split(';');
  for (const p of props) {
    const [k, v] = p.split(':').map(x => x.trim().toLowerCase());
    if (!k || !v) continue;
    if (k === 'font-weight' && v === 'bold') s.bold = true;
    if (k === 'font-style' && v === 'italic') s.italic = true;
    if (k === 'color') s.color = v;
    if (k === 'background-color') s.bgColor = v;
    if (k === 'font-size') s.fontSize = v;
    if (k === 'font-family') s.fontFamily = v;
    if (k === 'text-align') s.align = v;
    if (k === 'vertical-align') s.valign = v;
    if (k === 'border-top') s.borderTop = v;
    if (k === 'border-bottom') s.borderBottom = v;
    if (k === 'border-left') s.borderLeft = v;
    if (k === 'border-right') s.borderRight = v;
  }
  return s;
}

function normalizeHex(c: string): string {
  let h = c.replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return h.toUpperCase();
}

function borderStyle(s?: string) {
  if (!s) return undefined;
  const parts = s.split(' ');
  const size = parts[0] === '3px' ? 3 : parts[0] === '2px' ? 2 : 1;
  const color = normalizeHex(parts[2] || 'ccc');
  return { style: BorderStyle.SINGLE, size, color };
}

function docxAlign(align?: string) {
  if (!align) return undefined;
  const map: any = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
    justify: AlignmentType.JUSTIFIED,
  };
  return map[align];
}

export async function htmlToDocx(html: string, filename: string): Promise<ConversionResult> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const children: (Paragraph | Table)[] = [];

  function processNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        children.push(new Paragraph({
          children: [new TextRun({ text })],
        }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === 'table') {
        const rows = Array.from(el.querySelectorAll('tr'));
        if (rows.length === 0) return;

        const tableRows: TableRow[] = [];

        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td, th'));
          const docxCells: TableCell[] = [];

          for (const cell of cells) {
            const cellStyle = parseStyle(cell.getAttribute('style') || '');
            const colSpan = parseInt(cell.getAttribute('colspan') || '1');
            const rowSpan = parseInt(cell.getAttribute('rowspan') || '1');
            const cellText = cell.textContent || '';

            const runs: TextRun[] = [];
            if (cellText.trim()) {
              runs.push(new TextRun({
                text: cellText,
                bold: cellStyle.bold,
                italics: cellStyle.italic,
                color: cellStyle.color ? normalizeHex(cellStyle.color) : undefined,
                size: cellStyle.fontSize ? Math.round(parseFloat(cellStyle.fontSize) * 2) : undefined,
              }));
            }

            const cellChildren: (Paragraph | Table)[] = [];
            // Process child elements in the cell (paragraphs, lists, etc.)
            const cellSubNodes = Array.from(cell.childNodes);
            if (cellSubNodes.length === 1 && cellSubNodes[0].nodeType === Node.TEXT_NODE) {
              cellChildren.push(new Paragraph({
                children: runs,
                alignment: docxAlign(cellStyle.align),
              }));
            } else {
              let hasContent = false;
              for (const child of cellSubNodes) {
                if (child.nodeType === Node.TEXT_NODE && (child.textContent || '').trim()) {
                  hasContent = true;
                  cellChildren.push(new Paragraph({
                    children: [new TextRun({ text: child.textContent || '' })],
                    alignment: docxAlign(cellStyle.align),
                  }));
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                  hasContent = true;
                  const childEl = child as HTMLElement;
                  const childTag = childEl.tagName.toLowerCase();
                  if (['p', 'span', 'b', 'strong', 'i', 'em', 'br', 'div'].includes(childTag)) {
                    const childRuns: TextRun[] = [];
                    childEl.childNodes.forEach(cn => {
                      if (cn.nodeType === Node.TEXT_NODE && (cn.textContent || '').trim()) {
                        childRuns.push(new TextRun({ text: cn.textContent || '' }));
                      }
                    });
                    if (childRuns.length > 0) {
                      cellChildren.push(new Paragraph({
                        children: childRuns,
                        alignment: docxAlign(cellStyle.align),
                      }));
                    }
                  }
                }
              }
              if (!hasContent && runs.length > 0) {
                cellChildren.push(new Paragraph({
                  children: runs,
                  alignment: docxAlign(cellStyle.align),
                }));
              }
            }

            if (cellChildren.length === 0) {
              cellChildren.push(new Paragraph({ children: [] }));
            }

            const docxCellOptions: any = {
              children: cellChildren,
              columnSpan: colSpan,
              rowSpan: rowSpan,
            };

            const borders: any = {};
            const topB = borderStyle(cellStyle.borderTop);
            const bottomB = borderStyle(cellStyle.borderBottom);
            const leftB = borderStyle(cellStyle.borderLeft);
            const rightB = borderStyle(cellStyle.borderRight);
            if (topB) borders.top = topB;
            if (bottomB) borders.bottom = bottomB;
            if (leftB) borders.left = leftB;
            if (rightB) borders.right = rightB;
            if (Object.keys(borders).length > 0) {
              docxCellOptions.borders = borders;
            }

            if (cellStyle.bgColor) {
              docxCellOptions.shading = { type: ShadingType.CLEAR, fill: normalizeHex(cellStyle.bgColor) };
            }

            if (cellStyle.align) {
              docxCellOptions.verticalAlign = cellStyle.valign === 'top' ? 'top' as any : cellStyle.valign === 'bottom' ? 'bottom' as any : 'center' as any;
            }

            docxCells.push(new TableCell(docxCellOptions));
          }

          tableRows.push(new TableRow({ children: docxCells }));
        }

        // Borders for the whole table
        if (tableRows.length > 0) {
          children.push(new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }));
        }
      } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const level = parseInt(tag[1]) - 1;
        children.push(new Paragraph({
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
          children.push(new Paragraph({ children: runs }));
        }
      } else if (tag === 'br') {
        children.push(new Paragraph({ children: [] }));
      } else {
        el.childNodes.forEach(processNode);
      }
    }
  }

  doc.body.childNodes.forEach(processNode);

  if (children.length === 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: doc.body.textContent || '' })],
    }));
  }

  const docx = new Document({
    sections: [{ children }],
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
