import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak, VerticalMergeType, UnderlineType, ITableCellOptions, ITableOptions, VerticalAlign } from 'docx';
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

const COLOR_NAMES: Record<string, string> = {
  aliceblue: 'F0F8FF', antiquewhite: 'FAEBD7', aqua: '00FFFF', aquamarine: '7FFFD4', azure: 'F0FFFF',
  beige: 'F5F5DC', bisque: 'FFE4C4', black: '000000', blanchedalmond: 'FFEBCD', blue: '0000FF',
  blueviolet: '8A2BE2', brown: 'A52A2A', burlywood: 'DEB887', cadetblue: '5F9EA0', chartreuse: '7FFF00',
  chocolate: 'D2691E', coral: 'FF7F50', cornflowerblue: '6495ED', cornsilk: 'FFF8DC', crimson: 'DC143C',
  cyan: '00FFFF', darkblue: '00008B', darkcyan: '008B8B', darkgoldenrod: 'B8860B', darkgray: 'A9A9A9',
  darkgrey: 'A9A9A9', darkgreen: '006400', darkkhaki: 'BDB76B', darkmagenta: '8B008B', darkolivegreen: '556B2F',
  darkorange: 'FF8C00', darkorchid: '9932CC', darkred: '8B0000', darksalmon: 'E9967A', darkseagreen: '8FBC8F',
  darkslateblue: '483D8B', darkslategray: '2F4F4F', darkslategrey: '2F4F4F', darkturquoise: '00CED1',
  darkviolet: '9400D3', deeppink: 'FF1493', deepskyblue: '00BFFF', dimgray: '696969', dimgrey: '696969',
  dodgerblue: '1E90FF', firebrick: 'B22222', floralwhite: 'FFFAF0', forestgreen: '228B22', fuchsia: 'FF00FF',
  gainsboro: 'DCDCDC', ghostwhite: 'F8F8FF', gold: 'FFD700', goldenrod: 'DAA520', gray: '808080',
  grey: '808080', green: '008000', greenyellow: 'ADFF2F', honeydew: 'F0FFF0', hotpink: 'FF69B4',
  indianred: 'CD5C5C', indigo: '4B0082', ivory: 'FFFFF0', khaki: 'F0E68C', lavender: 'E6E6FA',
  lavenderblush: 'FFF0F5', lawngreen: '7CFC00', lemonchiffon: 'FFFACD', lightblue: 'ADD8E6',
  lightcoral: 'F08080', lightcyan: 'E0FFFF', lightgoldenrodyellow: 'FAFAD2', lightgray: 'D3D3D3',
  lightgrey: 'D3D3D3', lightgreen: '90EE90', lightpink: 'FFB6C1', lightsalmon: 'FFA07A',
  lightseagreen: '20B2AA', lightskyblue: '87CEFA', lightslategray: '778899', lightslategrey: '778899',
  lightsteelblue: 'B0C4DE', lightyellow: 'FFFFE0', lime: '00FF00', limegreen: '32CD32', linen: 'FAF0E6',
  magenta: 'FF00FF', maroon: '800000', mediumaquamarine: '66CDAA', mediumblue: '0000CD',
  mediumorchid: 'BA55D3', mediumpurple: '9370DB', mediumseagreen: '3CB371', mediumslateblue: '7B68EE',
  mediumspringgreen: '00FA9A', mediumturquoise: '48D1CC', mediumvioletred: 'C71585', midnightblue: '191970',
  mintcream: 'F5FFFA', mistyrose: 'FFE4E1', moccasin: 'FFE4B5', navajowhite: 'FFDEAD', navy: '000080',
  oldlace: 'FDF5E6', olive: '808000', olivedrab: '6B8E23', orange: 'FFA500', orangered: 'FF4500',
  orchid: 'DA70D6', palegoldenrod: 'EEE8AA', palegreen: '98FB98', paleturquoise: 'AFEEEE',
  palevioletred: 'DB7093', papayawhip: 'FFEFD5', peachpuff: 'FFDAB9', peru: 'CD853F', pink: 'FFC0CB',
  plum: 'DDA0DD', powderblue: 'B0E0E6', purple: '800080', rebeccapurple: '663399', red: 'FF0000',
  rosybrown: 'BC8F8F', royalblue: '4169E1', saddlebrown: '8B4513', salmon: 'FA8072', sandybrown: 'F4A460',
  seagreen: '2E8B57', seashell: 'FFF5EE', sienna: 'A0522D', silver: 'C0C0C0', skyblue: '87CEEB',
  slateisland: '6A5ACD', slateblue: '6A5ACD', slategray: '708090', slategrey: '708090', snow: 'FFFAFA',
  springgreen: '00FF7F', steelblue: '4682B4', tan: 'D2B48C', teal: '008080', thistle: 'D8BFD8',
  tomato: 'FF6347', turquoise: '40E0D0', violet: 'EE82EE', wheat: 'F5DEB3', white: 'FFFFFF',
  whitesmoke: 'F5F5F5', yellow: 'FFFF00', yellowgreen: '9ACD32'
};

function normalizeHex(c: string): string {
  if (!c) return '000000';
  const clean = c.trim().toLowerCase();
  if (clean === 'transparent') return 'FFFFFF';

  if (COLOR_NAMES[clean]) return COLOR_NAMES[clean];

  if (clean.startsWith('#')) {
    let hex = clean.replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return hex.slice(0, 6).toUpperCase();
  }

  const rgbMatch = clean.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return (r + g + b).toUpperCase();
  }

  if (/^[0-9a-fA-F]{3,6}$/.test(clean)) {
    let hex = clean;
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return hex.toUpperCase();
  }

  return '000000';
}

function parseBorderShorthand(s: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;
  
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if (char === ' ' && parenDepth === 0) {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current) {
    parts.push(current);
  }
  return parts;
}

function borderStyle(s?: string) {
  if (!s) return undefined;
  const lower = s.trim().toLowerCase();
  if (lower.includes('none') || lower === '0px') {
    return { style: BorderStyle.NONE, size: 0, color: 'AUTO' };
  }

  const parts = parseBorderShorthand(lower);
  let size = 1;
  let bStyle: typeof BorderStyle[keyof typeof BorderStyle] = BorderStyle.SINGLE;
  let color = 'CCCCCC';

  for (const part of parts) {
    if (part.endsWith('px') || part.endsWith('pt') || ['thin', 'medium', 'thick'].includes(part)) {
      if (part === 'thin') size = 1;
      else if (part === 'medium') size = 2;
      else if (part === 'thick') size = 3;
      else {
        const val = parseFloat(part);
        size = isNaN(val) ? 1 : Math.round(val);
      }
    } else if (['solid', 'dotted', 'dashed', 'double'].includes(part)) {
      if (part === 'dotted') bStyle = BorderStyle.DOTTED;
      else if (part === 'dashed') bStyle = BorderStyle.DASHED;
      else if (part === 'double') bStyle = BorderStyle.DOUBLE;
      else bStyle = BorderStyle.SINGLE;
    } else {
      color = normalizeHex(part);
    }
  }

  return { style: bStyle, size, color };
}

function docxAlign(align?: string): typeof AlignmentType[keyof typeof AlignmentType] | undefined {
  if (!align) return undefined;
  const map: Record<string, typeof AlignmentType[keyof typeof AlignmentType]> = {
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
          vMerge?: typeof VerticalMergeType[keyof typeof VerticalMergeType];
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

            const borders: Record<string, any> = {};
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

            const widthVal = cellStyle.width ? parseFloat(cellStyle.width) : NaN;

            const docxCellOptions: ITableCellOptions = {
              children: cellChildren,
              columnSpan: colSpan > 1 ? colSpan : undefined,
              verticalMerge: gridCell.vMerge,
              borders: Object.keys(borders).length > 0 ? (borders as any) : undefined,
              shading: cellStyle.bgColor ? { type: ShadingType.CLEAR, fill: normalizeHex(cellStyle.bgColor) } : undefined,
              verticalAlign: cellStyle.valign === 'top' ? VerticalAlign.TOP : cellStyle.valign === 'bottom' ? VerticalAlign.BOTTOM : VerticalAlign.CENTER,
              width: !isNaN(widthVal) ? {
                size: Math.round(widthVal * 15),
                type: WidthType.DXA,
              } : undefined,
            };

            docxCells.push(new TableCell(docxCellOptions));
          }

          tableRows.push(new TableRow({ children: docxCells }));
        }

        if (tableRows.length > 0) {
          const tableOptions: ITableOptions = {
            rows: tableRows,
            alignment: AlignmentType.CENTER,
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: {
              top: 100,
              bottom: 100,
              left: 150,
              right: 150,
            },
            columnWidths: columnWidthsDxa.length > 0 ? columnWidthsDxa : undefined,
          };
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
