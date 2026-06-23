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

    // Style header row
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
      row.eachCell((cell) => headers.push(String(cell.value || '')));
    } else {
      const rowData: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
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

export async function excelToHtml(file: File): Promise<ConversionResult> {
  const bytes = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);

  let html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
table{border-collapse:collapse;width:100%;margin:16px 0}
th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f5f5f5;font-weight:bold}
tr:nth-child(even){background:#fafafa}
</style></head><body>`;

  workbook.eachSheet((sheet) => {
    html += `<h2>${sheet.name}</h2><table>`;
    sheet.eachRow((row) => {
      html += '<tr>';
      row.eachCell((cell) => {
        const tag = row.number === 1 ? 'th' : 'td';
        html += `<${tag}>${cell.value || ''}</${tag}>`;
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
      row.eachCell((cell) => headers.push(String(cell.value || '')));
    } else {
      const rowData: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
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
