import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak, VerticalMergeType, UnderlineType } from 'docx';
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
  underline?: boolean;
  strike?: boolean;
  color?: string;
  bgColor?: string;
  fontSize?: string;
  fontFamily?: string;
  align?: string;
  valign?: string;
  width?: string;
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
    if (k === 'text-decoration') {
      if (v.includes('underline')) s.underline = true;
      if (v.includes('line-through')) s.strike = true;
    }
    if (k === 'color') s.color = v;
    if (k === 'background-color') s.bgColor = v;
    if (k === 'font-size') s.fontSize = v;
    if (k === 'font-family') s.fontFamily = v;
    if (k === 'text-align') s.align = v;
    if (k === 'vertical-align') s.valign = v;
    if (k === 'width') s.width = v;
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
  const lower = s.toLowerCase();
  if (lower.includes('none') || lower === '0px') {
    return { style: BorderStyle.NONE, size: 0, color: 'AUTO' };
  }
  const parts = s.split(' ');
  const size = parts[0] === '3px' ? 3 : parts[0] === '2px' ? 2 : 1;
  const color = normalizeHex(parts[2] || 'ccc');
  
  let bStyle: any = BorderStyle.SINGLE;
  if (lower.includes('dotted')) bStyle = BorderStyle.DOTTED;
  if (lower.includes('dashed')) bStyle = BorderStyle.DASHED;
  if (lower.includes('double')) bStyle = BorderStyle.DOUBLE;
  
  return { style: bStyle, size, color };
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

        const hasGridlines = el.classList.contains('gridlines') || el.className.includes('gridlines');

        // Parse cols for columnWidths
        const cols = Array.from(el.querySelectorAll('col'));
        const columnWidthsDxa: number[] = [];
        for (const col of cols) {
          const colStyle = col.getAttribute('style') || '';
          let wPx = 100;
          const match = colStyle.match(/width:\s*(\d+)px/i);
          if (match) {
            wPx = parseInt(match[1]);
          } else {
            const wAttr = col.getAttribute('width');
            if (wAttr) wPx = parseInt(wAttr);
          }
          columnWidthsDxa.push(Math.round(wPx * 15)); // 1px ≈ 15 DXA
        }

        // Grid-based table cell alignment tracker to handle rowspans and colspans
        const grid: {
          element: HTMLElement;
          isMaster: boolean;
          colSpan: number;
          rowSpan: number;
          vMerge?: string;
          hMerge: boolean;
        }[][] = [];

        const rowCount = rows.length;
        for (let r = 0; r < rowCount; r++) {
          grid[r] = [];
        }

        for (let r = 0; r < rowCount; r++) {
          const rowEl = rows[r];
          const cellElements = Array.from(rowEl.querySelectorAll('td, th'));
          let c = 0;

          for (const cellEl of cellElements) {
            // Find next free column index in this row
            while (grid[r][c] !== undefined) {
              c++;
            }

            const colSpan = parseInt(cellEl.getAttribute('colspan') || '1');
            const rowSpan = parseInt(cellEl.getAttribute('rowspan') || '1');

            // Fill grid for this cell and its merges
            for (let i = 0; i < rowSpan; i++) {
              const targetRow = r + i;
              if (targetRow >= rowCount) break;
              grid[targetRow] = grid[targetRow] || [];
              for (let j = 0; j < colSpan; j++) {
                const targetCol = c + j;
                if (i === 0 && j === 0) {
                  grid[targetRow][targetCol] = {
                    element: cellEl as HTMLElement,
                    isMaster: true,
                    colSpan,
                    rowSpan,
                    vMerge: rowSpan > 1 ? VerticalMergeType.RESTART : undefined,
                    hMerge: false,
                  };
                } else {
                  grid[targetRow][targetCol] = {
                    element: cellEl as HTMLElement,
                    isMaster: false,
                    colSpan,
                    rowSpan,
                    vMerge: rowSpan > 1 ? VerticalMergeType.CONTINUE : undefined,
                    hMerge: j > 0,
                  };
                }
              }
            }
            c += colSpan;
          }
        }

        const tableRows: TableRow[] = [];

        for (let r = 0; r < rowCount; r++) {
          const docxCells: TableCell[] = [];
          const colsInRow = grid[r].length;

          for (let c_idx = 0; c_idx < colsInRow; c_idx++) {
            const gridCell = grid[r][c_idx];
            if (!gridCell) continue;

            // If it is horizontally merged and not the first cell of the horizontal merge, skip it.
            // docx handles colSpan on the first cell directly.
            if (gridCell.hMerge) {
              continue;
            }

            const cell = gridCell.element;
            const cellStyle = parseStyle(cell.getAttribute('style') || '');
            const colSpan = gridCell.colSpan;
            const rowSpan = gridCell.rowSpan;
            const cellText = cell.textContent || '';

            const cellChildren: (Paragraph | Table)[] = [];

            if (gridCell.vMerge === VerticalMergeType.CONTINUE) {
              // Vertically merged continuation cells must contain an empty paragraph
              cellChildren.push(new Paragraph({ children: [] }));
            } else {
              const runs: TextRun[] = [];
              if (cellText.trim()) {
                runs.push(new TextRun({
                  text: cellText,
                  bold: cellStyle.bold,
                  italics: cellStyle.italic,
                  underline: cellStyle.underline ? { type: UnderlineType.SINGLE } : undefined,
                  strike: cellStyle.strike,
                  color: cellStyle.color ? normalizeHex(cellStyle.color) : undefined,
                  size: cellStyle.fontSize ? Math.round(parseFloat(cellStyle.fontSize) * 2) : undefined,
                  font: cellStyle.fontFamily ? cellStyle.fontFamily : undefined,
                }));
              }

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
                      children: [new TextRun({
                        text: child.textContent || '',
                        bold: cellStyle.bold,
                        italics: cellStyle.italic,
                        underline: cellStyle.underline ? { type: UnderlineType.SINGLE } : undefined,
                        strike: cellStyle.strike,
                        color: cellStyle.color ? normalizeHex(cellStyle.color) : undefined,
                        size: cellStyle.fontSize ? Math.round(parseFloat(cellStyle.fontSize) * 2) : undefined,
                        font: cellStyle.fontFamily ? cellStyle.fontFamily : undefined,
                      })],
                      alignment: docxAlign(cellStyle.align),
                    }));
                  } else if (child.nodeType === Node.ELEMENT_NODE) {
                    hasContent = true;
                    const childEl = child as HTMLElement;
                    const childTag = childEl.tagName.toLowerCase();
                    if (['p', 'span', 'b', 'strong', 'i', 'em', 'br', 'div', 'u', 'strike', 's'].includes(childTag)) {
                      const childRuns: TextRun[] = [];
                      childEl.childNodes.forEach(cn => {
                        if (cn.nodeType === Node.TEXT_NODE && (cn.textContent || '').trim()) {
                          childRuns.push(new TextRun({
                            text: cn.textContent || '',
                            bold: cellStyle.bold || childTag === 'b' || childTag === 'strong',
                            italics: cellStyle.italic || childTag === 'i' || childTag === 'em',
                            underline: cellStyle.underline || childTag === 'u' ? { type: UnderlineType.SINGLE } : undefined,
                            strike: cellStyle.strike || childTag === 'strike' || childTag === 's',
                            color: cellStyle.color ? normalizeHex(cellStyle.color) : undefined,
                            size: cellStyle.fontSize ? Math.round(parseFloat(cellStyle.fontSize) * 2) : undefined,
                            font: cellStyle.fontFamily ? cellStyle.fontFamily : undefined,
                          }));
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
            }

            if (cellChildren.length === 0) {
              cellChildren.push(new Paragraph({ children: [] }));
            }

            const docxCellOptions: any = {
              children: cellChildren,
              columnSpan: colSpan > 1 ? colSpan : undefined,
            };

            if (gridCell.vMerge) {
              docxCellOptions.vMerge = gridCell.vMerge;
            }

            const borders: any = {};
            if (hasGridlines) {
              const defaultGridBorder = { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' };
              borders.top = defaultGridBorder;
              borders.bottom = defaultGridBorder;
              borders.left = defaultGridBorder;
              borders.right = defaultGridBorder;
            }

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

            if (cellStyle.valign) {
              docxCellOptions.verticalAlign = cellStyle.valign === 'top' ? 'top' as any : cellStyle.valign === 'bottom' ? 'bottom' as any : 'center' as any;
            }

            if (cellStyle.width) {
              const widthVal = parseFloat(cellStyle.width);
              if (!isNaN(widthVal)) {
                docxCellOptions.width = {
                  size: Math.round(widthVal * 15), // Convert px to DXA (1px ≈ 15 DXA)
                  type: WidthType.DXA,
                };
              }
            }

            docxCells.push(new TableCell(docxCellOptions));
          }

          tableRows.push(new TableRow({ children: docxCells }));
        }

        if (tableRows.length > 0) {
          const tableOptions: any = {
            rows: tableRows,
            alignment: AlignmentType.CENTER,
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: {
              top: 100,
              bottom: 100,
              left: 150,
              right: 150,
            }
          };
          if (columnWidthsDxa.length > 0) {
            tableOptions.columnWidths = columnWidthsDxa;
          }
          children.push(new Table(tableOptions));
        }
      } else if (tag === 'div' && (el.classList.contains('page-break') || el.style.pageBreakBefore === 'always' || el.style.breakBefore === 'page')) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
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

export async function docxToExcel(file: File): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: bytes });
  const html = result.value;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.querySelectorAll('table');

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();

  if (tables.length === 0) {
    const sheet = workbook.addWorksheet('Document Text');
    sheet.columns = [{ header: 'Content', key: 'content', width: 80 }];
    const paragraphs = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    paragraphs.forEach((p) => {
      const text = p.textContent?.trim();
      if (text) {
        sheet.addRow({ content: text });
      }
    });
  } else {
    tables.forEach((table, index) => {
      const sheetName = `Table ${index + 1}`;
      const sheet = workbook.addWorksheet(sheetName);

      const rows = table.querySelectorAll('tr');
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td, th');
        const rowData: string[] = [];
        cells.forEach((cell) => {
          rowData.push(cell.textContent?.trim() || '');
        });
        sheet.addRow(rowData);
      });

      if (sheet.rowCount > 0) {
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true };
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    file: new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename: changeExtension(file.name, 'xlsx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}
