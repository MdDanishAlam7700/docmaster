import * as ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { ConversionResult, ConverterOptions } from '@/lib/types';
import { changeExtension } from '@/lib/utils';

export async function csvToExcel(file: File): Promise<ConversionResult> {
  const text = await file.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');

  if (parsed.data.length > 0 && typeof parsed.data[0] === 'object') {
    const headers = Object.keys(parsed.data[0] as object);
    sheet.addRow(headers);
    parsed.data.forEach((row: any) => {
      sheet.addRow(headers.map(h => row[h]));
    });

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    file: new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename: changeExtension(file.name, 'xlsx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

export async function excelToCsv(file: File): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('No worksheet found');

  const data: Record<string, any>[] = [];
  const headers: string[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => headers.push(String(cell.value || '')));
    } else {
      const rowData: Record<string, any> = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        rowData[headers[colNumber - 1] || `Col${colNumber}`] = cell.value;
      });
      data.push(rowData);
    }
  });

  const csv = Papa.unparse(data);
  return {
    file: new Blob([csv], { type: 'text/csv' }),
    filename: changeExtension(file.name, 'csv'),
    mimeType: 'text/csv',
  };
}

const standardThemeColors = [
  'FFFFFF', // 0: White
  '000000', // 1: Black
  'E7E6E6', // 2: Light Gray (Background 1)
  '44546A', // 3: Dark Blue Gray (Text 1)
  '5B9BD5', // 4: Accent 1 (Blue)
  'ED7D31', // 5: Accent 2 (Orange)
  'A5A5A5', // 6: Accent 3 (Gray)
  'FFC000', // 7: Accent 4 (Gold)
  '4472C4', // 8: Accent 5 (Blue)
  '70AD47', // 9: Accent 6 (Green)
];

const indexedColors: Record<number, string> = {
  8: '000000', 9: 'FFFFFF', 10: 'FF0000', 11: '00FF00', 12: '0000FF', 13: 'FFFF00', 14: 'FF00FF', 15: '00FFFF',
  16: '800000', 17: '008000', 18: '000080', 19: '808000', 20: '800080', 21: '008080', 22: 'C0C0C0', 23: '808080',
  24: '9999FF', 25: '993366', 26: 'FFFFCC', 27: 'CCFFFF', 28: '660066', 29: 'FF8080', 30: '0066CC', 31: 'CCCCFF',
  32: '000080', 33: 'FF00FF', 34: 'FFFF00', 35: '00FFFF', 36: '800080', 37: '800000', 38: '008080', 39: '0000FF',
  40: '00CCFF', 41: 'CCFFFF', 42: 'CCFFCC', 43: 'FFFF99', 44: '99CCFF', 45: 'FF99CC', 46: 'CC99FF', 47: 'FFCC99',
  48: '3366FF', 49: '33CCCC', 50: '99CC00', 51: 'FFCC00', 52: 'FF9900', 53: 'FF6600', 54: '666699', 55: '969696',
  56: '003366', 57: '339966', 58: '003300', 59: '333300', 60: '993300', 61: '993366', 62: '333399', 63: '333333'
};

function applyTint(hex: string, tint?: number): string {
  if (tint === undefined || tint === 0) return '#' + hex;
  
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

  const rHex = Math.max(0, Math.min(255, r)).toString(16).padStart(2, '0');
  const gHex = Math.max(0, Math.min(255, g)).toString(16).padStart(2, '0');
  const bHex = Math.max(0, Math.min(255, b)).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

function cssColor(color: any): string {
  if (!color) return '';
  // Handle direct string color values.
  // Modern CSS color functions (oklch, oklab, lab, lch, color()) are not renderable
  // by html2canvas — fall back to black for any match.
  if (typeof color === 'string') {
    if (/^\s*(oklch|oklab|lab|lch|color)\s*\(/i.test(color)) {
      return '#000000';
    }
    return color;
  }
  
  let hex = '';
  if (color.argb) {
    hex = color.argb.length > 6 ? color.argb.slice(2) : color.argb;
  } else if (color.theme !== undefined) {
    const themeIndex = color.theme;
    const baseColor = standardThemeColors[themeIndex] || '000000';
    return applyTint(baseColor, color.tint);
  } else if (color.indexed !== undefined) {
    hex = indexedColors[color.indexed] || '000000';
  }
  
  if (hex) {
    if (color.tint !== undefined) {
      return applyTint(hex, color.tint);
    }
    return '#' + hex;
  }
  
  if (color.rgb) return `rgb(${color.rgb.r},${color.rgb.g},${color.rgb.b})`;
  return '';
}

function formatCellValue(value: any, numFmt?: string): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    if (numFmt) {
      const fmt = numFmt.toLowerCase();
      if (fmt.includes('yyyy') || fmt.includes('yy')) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const date = String(value.getDate()).padStart(2, '0');
        if (fmt.includes('yyyy-mm-dd') || fmt.includes('yyyy/mm/dd')) return `${year}-${month}-${date}`;
        return `${month}/${date}/${year}`;
      }
    }
    return value.toLocaleDateString();
  }
  
  if (typeof value === 'number') {
    if (!numFmt) return String(value);
    
    // Check percentage
    if (numFmt.endsWith('%')) {
      const decimalsMatch = numFmt.match(/0\.([0]+)%/);
      const decimals = decimalsMatch ? decimalsMatch[1].length : 0;
      return (value * 100).toFixed(decimals) + '%';
    }
    
    // Check currency or number with commas
    if (numFmt.includes('#,##0')) {
      const hasDecimals = numFmt.includes('.');
      const decimalsMatch = numFmt.match(/\.([0#]+)/);
      const decimals = hasDecimals && decimalsMatch ? decimalsMatch[1].length : 0;
      
      const parts = value.toFixed(decimals).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const formattedNum = parts.join('.');
      
      if (numFmt.includes('$')) return '$' + formattedNum;
      if (numFmt.includes('€')) return '€' + formattedNum;
      if (numFmt.includes('£')) return '£' + formattedNum;
      if (numFmt.includes('¥')) return '¥' + formattedNum;
      return formattedNum;
    }
    
    // Fixed decimals like "0.00"
    if (/^0\.0+$/.test(numFmt)) {
      const decimals = numFmt.split('.')[1].length;
      return value.toFixed(decimals);
    }
  }

  if (typeof value === 'object') {
    if (Array.isArray((value as any).richText)) {
      return (value as any).richText.map((t: any) => t.text || '').join('');
    }
    const resultVal = (value as any).result ?? (value as any).formula ?? (value as any).text ?? String(value);
    if (typeof resultVal === 'object') {
      return '';
    }
    return String(resultVal);
  }
  
  return String(value);
}

function buildBorderStyle(border: any, side: string): string {
  if (!border || !border[side]) return '';
  const s = border[side];
  const style = s.style || '';
  const color = cssColor(s.color);
  const widthMap: Record<string, string> = {
    thin: '1px', medium: '2px', thick: '3px',
    hair: '0.5px', dotted: '1px', dashed: '1px',
    'double': '3px',
  };
  const w = widthMap[style] || '1px';
  const styleMap: Record<string, string> = {
    thin: 'solid', medium: 'solid', thick: 'solid',
    hair: 'solid', dotted: 'dotted', dashed: 'dashed',
    'double': 'double',
  };
  const s2 = styleMap[style] || 'solid';
  return `${w} ${s2} ${color || '#ccc'}`;
}

export async function excelToHtml(file: File): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);

  let html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;padding:20px;background:#f8fafc}
table{border-collapse:collapse;background:#fff;margin-bottom:20px;table-layout:fixed;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
td,th{padding:4px 6px;min-width:30px;overflow:hidden;text-overflow:ellipsis}
table.gridlines{border:1px solid #cbd5e1}
table.gridlines td, table.gridlines th{border:1px solid #e2e8f0}
th{background-color:#f1f5f9;font-weight:bold}
.page-break{page-break-before:always;break-before:page;}
</style></head><body>`;

  let isFirstSheet = true;

  workbook.eachSheet((sheet) => {
    let showGrid = true;
    if (sheet.views && sheet.views.length > 0) {
      const view = sheet.views[0];
      showGrid = view ? (view as any).showGridLines !== false : true;
    }

    const defaultColW = sheet.properties?.defaultColWidth ? Math.round(sheet.properties.defaultColWidth * 8) : 80;
    const colWidths: Record<number, string> = {};
    const maxCols = Math.max(sheet.columnCount, 1);
    for (let c = 1; c <= maxCols; c++) {
      const col = sheet.getColumn(c);
      if (col && col.width) {
        colWidths[c] = `${Math.round(col.width * 8)}px`;
      } else {
        colWidths[c] = `${defaultColW}px`;
      }
    }

    let totalWidth = 0;
    let colGroups = '';
    for (let c = 1; c <= maxCols; c++) {
      const colWStr = colWidths[c];
      const colWPx = colWStr ? parseInt(colWStr) : defaultColW;
      totalWidth += colWPx;
      colGroups += `<col style="width:${colWPx}px">`;
    }

    const mergeRanges: Record<string, { rowspan: number; colspan: number }> = {};
    const rowHeights: Record<number, string> = {};

    if (sheet.hasMerges) {
      // ExcelJS stores merge ranges in the internal _merges map (object keyed by range string)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mergesMap: Record<string, unknown> = (sheet as any)._merges || {};
      for (const range of Object.keys(mergesMap)) {
        const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
        if (match) {
          const startCol = match[1].charCodeAt(0) - 65 + 1;
          const startRow = parseInt(match[2]);
          const endCol = match[3].charCodeAt(0) - 65 + 1;
          const endRow = parseInt(match[4]);
          mergeRanges[`${startRow}:${startCol}`] = {
            rowspan: endRow - startRow + 1,
            colspan: endCol - startCol + 1,
          };
        }
      }
    }

    const occupiedCells = new Set<string>();

    if (!isFirstSheet) {
      html += `<div class="page-break"></div>`;
    }
    isFirstSheet = false;

    html += `<h2 style="margin:20px 0 8px 0;font-size:16px;color:#334155">${sheet.name}</h2>`;
    html += `<table class="${showGrid ? 'gridlines' : ''}" style="min-width:${totalWidth}px;width:${totalWidth}px">`;
    html += colGroups;

    sheet.eachRow((row) => {
      const heightPx = row.height ? Math.round(row.height * 1.33) : undefined;
      if (heightPx) rowHeights[row.number] = `${heightPx}px`;

      html += `<tr${heightPx ? ` style="height:${heightPx}px"` : ''}>`;

      for (let colNumber = 1; colNumber <= maxCols; colNumber++) {
        const cell = row.getCell(colNumber);
        const cellKey = `${row.number}:${colNumber}`;
        if (occupiedCells.has(cellKey)) continue;

        const mergeKey = `${row.number}:${colNumber}`;
        const merge = mergeRanges[mergeKey];
        const isMerged = cell.isMerged;
        const masterAddr = cell.master ? cell.master.address : null;

        let colspan = 1;
        let rowspan = 1;
        let skipRender = false;

        if (merge) {
          colspan = merge.colspan;
          rowspan = merge.rowspan;
          for (let r = 0; r < merge.rowspan; r++) {
            for (let c = 0; c < merge.colspan; c++) {
              if (r !== 0 || c !== 0) {
                occupiedCells.add(`${row.number + r}:${colNumber + c}`);
              }
            }
          }
        } else if (cell.isMerged && masterAddr) {
          occupiedCells.add(cellKey);
          skipRender = true;
        }

        if (skipRender) continue;

        const tag = row.number === 1 ? 'th' : 'td';
        const font = cell.font || {};
        const fill = cell.fill || {};
        const border = cell.border || {};
        const alignment = cell.alignment || {};

        const styles: string[] = [];

        if (font.name) styles.push(`font-family:${font.name}`);
        if (font.size) styles.push(`font-size:${font.size}pt`);
        if (font.bold) styles.push('font-weight:bold');
        if (font.italic) styles.push('font-style:italic');
        if (font.underline) styles.push('text-decoration:underline');
        if (font.strike) styles.push('text-decoration:line-through');
        if (font.color) {
          const c = cssColor(font.color);
          if (c) styles.push(`color:${c}`);
        }

        if (fill.type === 'pattern' && fill.fgColor) {
          const c = cssColor(fill.fgColor);
          if (c) styles.push(`background-color:${c}`);
        }

        const topB = buildBorderStyle(border, 'top');
        const bottomB = buildBorderStyle(border, 'bottom');
        const leftB = buildBorderStyle(border, 'left');
        const rightB = buildBorderStyle(border, 'right');
        if (topB) styles.push(`border-top:${topB}`);
        if (bottomB) styles.push(`border-bottom:${bottomB}`);
        if (leftB) styles.push(`border-left:${leftB}`);
        if (rightB) styles.push(`border-right:${rightB}`);

        if (alignment.horizontal) {
          const map: Record<string, string> = {
            left: 'left',
            center: 'center',
            right: 'right',
            justify: 'justify',
          };
          const cssAlign = map[alignment.horizontal];
          if (cssAlign) styles.push(`text-align:${cssAlign}`);
        }
        if (alignment.vertical) {
          const map: Record<string, string> = {
            top: 'top',
            middle: 'middle',
            bottom: 'bottom',
          };
          const cssVAlign = map[alignment.vertical];
          if (cssVAlign) styles.push(`vertical-align:${cssVAlign}`);
        }
        if (alignment.indent) {
          styles.push(`padding-left:${alignment.indent * 8}px`);
        }
        if (alignment.wrapText) {
          styles.push('white-space:normal;word-wrap:break-word;overflow:visible');
        } else {
          styles.push('white-space:nowrap;overflow:hidden;text-overflow:clip');
        }

        // Calculate cell width based on spanned columns
        let cellWidthPx = 0;
        for (let c = 0; c < colspan; c++) {
          const colWStr = colWidths[colNumber + c];
          const colWPx = colWStr ? parseInt(colWStr) : defaultColW;
          cellWidthPx += colWPx;
        }
        styles.push(`width:${cellWidthPx}px`);

        let colSpanStr = colspan > 1 ? ` colspan="${colspan}"` : '';
        let rowSpanStr = rowspan > 1 ? ` rowspan="${rowspan}"` : '';
        let styleStr = styles.length > 0 ? ` style="${styles.join(';')}"` : '';

        const valStr = formatCellValue(cell.value, cell.numFmt);

        html += `<${tag}${colSpanStr}${rowSpanStr}${styleStr}>${valStr}</${tag}>`;
      }

      html += '</tr>';
    });

    html += '</table>';
  });

  html += '</body></html>';
  return {
    file: new Blob([html], { type: 'text/html' }),
    filename: changeExtension(file.name, 'html'),
    mimeType: 'text/html',
  };
}

export async function excelToJson(file: File): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('No worksheet found');

  const data: Record<string, any>[] = [];
  const headers: string[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => headers.push(String(cell.value || '')));
    } else {
      const rowData: Record<string, any> = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        rowData[headers[colNumber - 1] || `Col${colNumber}`] = cell.value;
      });
      data.push(rowData);
    }
  });

  const json = JSON.stringify(data, null, 2);
  return {
    file: new Blob([json], { type: 'application/json' }),
    filename: changeExtension(file.name, 'json'),
    mimeType: 'application/json',
  };
}

export async function htmlTableToExcel(html: string, filename: string): Promise<ConversionResult> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) throw new Error('No table found in HTML');

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');

  const rows = Array.from(table.children).filter(el => el.tagName === 'TBODY' ? Array.from(el.children) : [el]).flat();
  const rowEls = table.querySelectorAll(':scope > tr, :scope > tbody > tr');
  rowEls.forEach((row) => {
    const cells = row.querySelectorAll(':scope > td, :scope > th');
    const rowData: any[] = [];
    cells.forEach((cell) => rowData.push(cell.textContent?.trim() || ''));
    sheet.addRow(rowData);
  });

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    file: new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename: changeExtension(filename, 'xlsx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

export async function pdfToExcel(
  file: File,
  options?: ConverterOptions
): Promise<ConversionResult> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  const PDFJS_VERSION = '6.0.227';
  GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`;

  const bytes = await file.arrayBuffer();
  const pdf = await getDocument({ data: bytes }).promise;
  const totalPages = pdf.numPages;

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();

  for (let p = 1; p <= totalPages; p++) {
    if (options?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    options?.onProgress?.(Math.round((p / totalPages) * 100), `Processing page ${p} of ${totalPages}`);

    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    
    const items: { str: string; x: number; y: number; height: number }[] = [];
    for (const item of content.items) {
      const it = item as any;
      if (!it.str || !it.str.trim()) continue;
      items.push({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        height: it.height || 12,
      });
    }

    const sheetName = `Page ${p}`;
    const sheet = workbook.addWorksheet(sheetName);

    if (items.length === 0) continue;

    const Y_THRESHOLD = 4;
    const rowClusters: typeof items[] = [];
    const sortedByY = [...items].sort((a, b) => b.y - a.y);

    for (const item of sortedByY) {
      let placed = false;
      for (const cluster of rowClusters) {
        if (Math.abs(cluster[0].y - item.y) < Y_THRESHOLD) {
          cluster.push(item);
          placed = true;
          break;
        }
      }
      if (!placed) rowClusters.push([item]);
    }

    for (const cluster of rowClusters) {
      cluster.sort((a, b) => a.x - b.x);
    }

    rowClusters.sort((a, b) => b[0].y - a[0].y);

    const X_GAP_THRESHOLD = 15;

    for (const cluster of rowClusters) {
      const rowCells: string[] = [];
      let currentCellText = '';
      let lastX = -1;

      for (const item of cluster) {
        if (lastX === -1) {
          currentCellText = item.str;
        } else if (item.x - lastX > X_GAP_THRESHOLD) {
          rowCells.push(currentCellText);
          currentCellText = item.str;
        } else {
          const space = currentCellText.endsWith(' ') || item.str.startsWith(' ') ? '' : ' ';
          currentCellText += space + item.str;
        }
        lastX = item.x + (item.str.length * 6);
      }

      if (currentCellText) {
        rowCells.push(currentCellText);
      }

      sheet.addRow(rowCells);
    }

    sheet.columns.forEach((column) => {
      let maxLen = 10;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const valLen = String(cell.value || '').length;
        if (valLen > maxLen) maxLen = valLen;
      });
      column.width = Math.min(maxLen + 2, 50);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    file: new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename: changeExtension(file.name, 'xlsx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}
