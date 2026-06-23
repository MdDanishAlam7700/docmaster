import * as ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { ConversionResult } from '@/lib/types';
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

  sheet.eachRow((row, rowNumber) => {
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

function formatHex(argb?: string): string {
  if (!argb) return '';
  return '#' + (argb.length > 6 ? argb.slice(2) : argb);
}

function cssColor(color: any): string {
  if (!color) return '';
  if (typeof color === 'string') return color;
  if (color.argb) return formatHex(color.argb);
  if (color.rgb) return `rgb(${color.rgb.r},${color.rgb.g},${color.rgb.b})`;
  if (color.theme !== undefined) return '';
  return '';
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
table{border-collapse:collapse;border:1px solid #cbd5e1;background:#fff;margin-bottom:20px}
td,th{border:1px solid #cbd5e1;padding:6px 10px;min-width:60px;overflow:hidden;text-overflow:ellipsis}
th{background-color:#f1f5f9;font-weight:bold}
</style></head><body>`;

  workbook.eachSheet((sheet) => {
    const colWidths: Record<number, string> = {};
    sheet.columns?.forEach((col, i) => {
      if (col.width) colWidths[i + 1] = `${Math.round(col.width * 7)}px`;
    });

    const mergeRanges: Record<string, { rowspan: number; colspan: number }> = {};
    const rowHeights: Record<number, string> = {};

    if (sheet.hasMerges && (sheet as any)._merges) {
      const merges = (sheet as any)._merges as Record<string, { model: { top: number; left: number; bottom: number; right: number } }>;
      for (const key of Object.keys(merges)) {
        const m = merges[key];
        const startRow = m.model.top;
        const startCol = m.model.left;
        mergeRanges[`${startRow}:${startCol}`] = {
          rowspan: m.model.bottom - m.model.top + 1,
          colspan: m.model.right - m.model.left + 1,
        };
      }
    }

    const occupiedCells = new Set<string>();

    html += `<h2 style="margin:0 0 8px 0">${sheet.name}</h2>`;
    html += `<table style="min-width:${sheet.columnCount * 100}px">`;

    sheet.eachRow((row) => {
      if (row.height) rowHeights[row.number] = `${row.height}px`;

      html += `<tr${row.height ? ` style="height:${row.height}px"` : ''}>`;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const cellKey = `${row.number}:${colNumber}`;
        if (occupiedCells.has(cellKey)) return;

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
          const parts = masterAddr.match(/([A-Z]+)(\d+)/);
          if (parts) {
            const mCol = parts[1];
            const mRow = parseInt(parts[2]);
            occupiedCells.add(cellKey);
            skipRender = true;
          }
        }

        if (skipRender) return;

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
        if (font.color) {
          const c = cssColor(font.color);
          if (c) styles.push(`color:${c}`);
        }

        if (fill.type === 'pattern' && fill.pattern === 'solid' && fill.fgColor) {
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

        if (alignment.horizontal) styles.push(`text-align:${alignment.horizontal}`);
        if (alignment.vertical) styles.push(`vertical-align:${alignment.vertical}`);
        if (alignment.wrapText) styles.push('white-space:normal;word-wrap:break-word');

        let colSpanStr = colspan > 1 ? ` colspan="${colspan}"` : '';
        let rowSpanStr = rowspan > 1 ? ` rowspan="${rowspan}"` : '';
        let styleStr = styles.length > 0 ? ` style="${styles.join(';')}"` : '';

        let cellValue: any = cell.value;
        if (cellValue === null || cellValue === undefined) cellValue = '';
        if (typeof cellValue === 'object') {
          if (Array.isArray((cellValue as any).richText)) {
            cellValue = (cellValue as any).richText.map((t: any) => t.text || '').join('');
          } else {
            cellValue = (cellValue as any).result ?? (cellValue as any).formula ?? (cellValue as any).text ?? String(cellValue);
          }
        }

        html += `<${tag}${colSpanStr}${rowSpanStr}${styleStr}>${String(cellValue)}</${tag}>`;
      });

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

  sheet.eachRow((row, rowNumber) => {
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

  const rows = table.querySelectorAll('tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td, th');
    const rowData: any[] = [];
    cells.forEach((cell) => rowData.push(cell.textContent?.trim() || ''));
    sheet.addRow(rowData);
  });

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    file: new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename: changeExtension(filename, 'xlsx'),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}
