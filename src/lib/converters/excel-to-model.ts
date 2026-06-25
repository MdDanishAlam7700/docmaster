/**
 * excel-to-model.ts
 *
 * Parses an ExcelJS workbook into a typed SpreadsheetModel.
 * This is the "bridge" layer described in the implementation plan:
 * it converts raw ExcelJS cell objects into clean CellModel objects
 * that the SpreadsheetRenderer can consume without touching HTML strings.
 */

import type * as ExcelJSType from 'exceljs';
import type { CellModel, SheetModel, SpreadsheetModel } from '@/lib/document-model';

// ── Colour palette helpers ────────────────────────────────────────────────────

const THEME_COLORS = [
  'FFFFFF', '000000', 'E7E6E6', '44546A',
  '5B9BD5', 'ED7D31', 'A5A5A5', 'FFC000',
  '4472C4', '70AD47',
];

const INDEXED_COLORS: Record<number, string> = {
  8: '000000', 9: 'FFFFFF', 10: 'FF0000', 11: '00FF00', 12: '0000FF',
  13: 'FFFF00', 14: 'FF00FF', 15: '00FFFF', 16: '800000', 17: '008000',
  18: '000080', 19: '808000', 20: '800080', 21: '008080', 22: 'C0C0C0',
  23: '808080', 40: '00CCFF', 41: 'CCFFFF', 42: 'CCFFCC', 43: 'FFFF99',
  44: '99CCFF', 45: 'FF99CC', 46: 'CC99FF', 47: 'FFCC99', 64: 'AUTOMATIC',
};

function applyTint(hex: string, tint = 0): string {
  if (!tint) return `#${hex}`;
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);
  if (tint > 0) {
    r = Math.round(r + (255 - r) * tint);
    g = Math.round(g + (255 - g) * tint);
    b = Math.round(b + (255 - b) * tint);
  } else {
    r = Math.round(r * (1 + tint));
    g = Math.round(g * (1 + tint));
    b = Math.round(b * (1 + tint));
  }
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`.toUpperCase();
}

function resolveColor(color: unknown): string {
  if (!color || typeof color !== 'object') return '';
  const c = color as Record<string, unknown>;
  if (typeof c.argb === 'string') {
    const hex = c.argb.length > 6 ? c.argb.slice(2) : c.argb;
    return applyTint(hex, c.tint as number | undefined);
  }
  if (typeof c.theme === 'number') {
    const base = THEME_COLORS[c.theme] ?? '000000';
    return applyTint(base, c.tint as number | undefined);
  }
  if (typeof c.indexed === 'number') {
    const hex = INDEXED_COLORS[c.indexed] ?? '000000';
    return hex === 'AUTOMATIC' ? '' : `#${hex}`;
  }
  return '';
}

// ── Border helper ─────────────────────────────────────────────────────────────

function borderCss(border: unknown, side: string): string {
  if (!border || typeof border !== 'object') return '';
  const b = (border as Record<string, unknown>)[side] as Record<string, unknown> | undefined;
  if (!b?.style) return '';
  const styleStr = String(b.style);
  if (styleStr === 'none') return '';
  const widthMap: Record<string, string> = {
    thin: '1px', medium: '2px', thick: '3px',
    hair: '0.5px', dotted: '1px', dashed: '1px', double: '3px',
  };
  const cssStyleMap: Record<string, string> = {
    thin: 'solid', medium: 'solid', thick: 'solid',
    hair: 'solid', dotted: 'dotted', dashed: 'dashed', double: 'double',
  };
  const w = widthMap[styleStr] ?? '1px';
  const s = cssStyleMap[styleStr] ?? 'solid';
  const c = resolveColor(b.color) || '#cccccc';
  return `${w} ${s} ${c}`;
}

// ── Cell value formatter ──────────────────────────────────────────────────────

function formatValue(value: unknown, numFmt?: string): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'number') {
    if (!numFmt) return String(value);
    if (numFmt.endsWith('%')) {
      const d = (numFmt.match(/\.([0]+)%/) ?? [])[1]?.length ?? 0;
      return (value * 100).toFixed(d) + '%';
    }
    if (numFmt.includes('#,##0')) {
      const d = (numFmt.match(/\.([0#]+)/) ?? [])[1]?.length ?? 0;
      const parts = value.toFixed(d).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const n = parts.join('.');
      if (numFmt.includes('$')) return `$${n}`;
      if (numFmt.includes('€')) return `€${n}`;
      if (numFmt.includes('£')) return `£${n}`;
      return n;
    }
    if (/^0\.0+$/.test(numFmt)) return value.toFixed(numFmt.split('.')[1].length);
    return String(value);
  }
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (Array.isArray(v.richText)) return (v.richText as Array<{ text?: string }>).map(t => t.text ?? '').join('');
    const r = v.result ?? v.formula ?? v.text ?? v.sharedFormula;
    return r != null ? String(r) : '';
  }
  return String(value);
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function parseExcelToModel(file: File): Promise<SpreadsheetModel> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const sheets: SheetModel[] = [];

  workbook.eachSheet((sheet: ExcelJSType.Worksheet) => {
    // Grid-line visibility
    let showGridlines = true;
    const views = sheet.views as unknown as Array<{ showGridLines?: boolean }>;
    if (views?.length > 0 && views[0].showGridLines === false) showGridlines = false;

    // Column widths
    const defaultColW = sheet.properties?.defaultColWidth
      ? Math.round((sheet.properties as unknown as { defaultColWidth: number }).defaultColWidth * 8)
      : 80;
    const maxCols = Math.max(sheet.columnCount, 1);
    const colWidthsPx: number[] = [];
    for (let c = 1; c <= maxCols; c++) {
      const col = sheet.getColumn(c);
      colWidthsPx.push(col?.width ? Math.round(col.width * 8) : defaultColW);
    }
    const totalWidthPx = colWidthsPx.reduce((a, b) => a + b, 0);

    // Merge ranges — ExcelJS stores in _merges map
    const mergeRanges: Record<string, { rowspan: number; colspan: number }> = {};
    if (sheet.hasMerges) {
      const mergesMap: Record<string, unknown> = (sheet as unknown as { _merges: Record<string, unknown> })._merges ?? {};
      for (const range of Object.keys(mergesMap)) {
        const m = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
        if (m) {
          const c1 = m[1].split('').reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0);
          const r1 = parseInt(m[2]);
          const c2 = m[3].split('').reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0);
          const r2 = parseInt(m[4]);
          mergeRanges[`${r1}:${c1}`] = { rowspan: r2 - r1 + 1, colspan: c2 - c1 + 1 };
        }
      }
    }

    // Build rows
    const rows: CellModel[][] = [];
    const rowHeightsPx: (number | undefined)[] = [];
    const occupied = new Set<string>();

    sheet.eachRow((row: ExcelJSType.Row) => {
      const ri = row.number;
      const heightPx = row.height ? Math.round(row.height * 1.33) : undefined;
      rowHeightsPx[ri - 1] = heightPx;

      const cells: CellModel[] = [];

      for (let ci = 1; ci <= maxCols; ci++) {
        const key = `${ri}:${ci}`;
        const isOccupied = occupied.has(key);

        if (isOccupied) {
          cells.push({
            value: '', colspan: 1, rowspan: 1, isOccupied: true,
            bold: false, italic: false, underline: false, strike: false,
            fontSize: 11, fontFamily: '', color: '', bgColor: '',
            textAlign: '', vertAlign: '', wrapText: false, indentPx: 0,
            borderTop: '', borderRight: '', borderBottom: '', borderLeft: '',
            widthPx: colWidthsPx[ci - 1] ?? defaultColW,
          });
          continue;
        }

        const cell = row.getCell(ci);
        const merge = mergeRanges[key];
        const colspan = merge?.colspan ?? 1;
        const rowspan = merge?.rowspan ?? 1;

        // Mark spans as occupied
        for (let dr = 0; dr < rowspan; dr++) {
          for (let dc = 0; dc < colspan; dc++) {
            if (dr > 0 || dc > 0) occupied.add(`${ri + dr}:${ci + dc}`);
          }
        }

        const font = (cell.font ?? {}) as Record<string, unknown>;
        const fill = (cell.fill as unknown ?? {}) as Record<string, unknown>;
        const border = cell.border ?? {};
        const aln = (cell.alignment ?? {}) as Record<string, unknown>;

        // Cell width = sum of spanned columns
        let widthPx = 0;
        for (let dc = 0; dc < colspan; dc++) {
          widthPx += colWidthsPx[ci - 1 + dc] ?? defaultColW;
        }

        const alignMap: Record<string, 'left' | 'center' | 'right' | 'justify'> = {
          left: 'left', center: 'center', right: 'right', justify: 'justify',
          centerContinuous: 'center', distributed: 'justify',
        };
        const vAlignMap: Record<string, 'top' | 'middle' | 'bottom'> = {
          top: 'top', middle: 'middle', bottom: 'bottom', distributed: 'middle',
        };

        let bgColor = '';
        if (fill.type === 'pattern' && fill.fgColor) {
          bgColor = resolveColor(fill.fgColor);
        }

        const model: CellModel = {
          value: formatValue(cell.value, cell.numFmt),
          colspan,
          rowspan,
          isOccupied: false,
          bold: Boolean(font.bold),
          italic: Boolean(font.italic),
          underline: Boolean(font.underline),
          strike: Boolean(font.strike),
          fontSize: typeof font.size === 'number' ? font.size : 11,
          fontFamily: typeof font.name === 'string' ? font.name : '',
          color: resolveColor(font.color),
          bgColor,
          textAlign: alignMap[String(aln.horizontal ?? '')] ?? '',
          vertAlign: vAlignMap[String(aln.vertical ?? '')] ?? '',
          wrapText: Boolean(aln.wrapText),
          indentPx: typeof aln.indent === 'number' ? (aln.indent as number) * 8 : 0,
          borderTop: borderCss(border, 'top'),
          borderRight: borderCss(border, 'right'),
          borderBottom: borderCss(border, 'bottom'),
          borderLeft: borderCss(border, 'left'),
          widthPx,
        };

        cells.push(model);
      }

      rows.push(cells);
    });

    sheets.push({ name: sheet.name, rows, colWidthsPx, rowHeightsPx, totalWidthPx, showGridlines });
  });

  return { sheets, filename: file.name };
}
