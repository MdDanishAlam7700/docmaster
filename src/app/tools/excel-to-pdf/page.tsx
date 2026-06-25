'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileSpreadsheet } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function ExcelToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const { excelToHtml } = await import('@/lib/converters/excel-converter');
    const { renderHtmlToPdf } = await import('@/lib/converters/html-to-pdf');

    // excelToHtml produces a richly styled HTML document with:
    // - Exact column widths from the Excel file
    // - Cell background colors, font styles, borders
    // - Merged cell spans (colspan/rowspan)
    // - Row heights
    const htmlResult = await excelToHtml(files[0].file);
    const html = await htmlResult.file.text();

    // renderHtmlToPdf will:
    // - Auto-detect landscape orientation when the sheet is wider than A4 portrait
    // - Set container width to actual content width to prevent clipping
    // - Use html2canvas at 2× scale for crisp rendering
    return renderHtmlToPdf(html, files[0].name, {
      marginMm: 8,    // tight margin for spreadsheets to maximise content area
      quality: 0.95,
      scale: 2,
    });
  };

  return (
    <ToolPageTemplate
      title="Excel to PDF"
      description="Convert Excel spreadsheets to PDF — formatting, borders, colors, and column widths all preserved. Wide sheets automatically use landscape orientation."
      icon={<FileSpreadsheet className="h-7 w-7" />}
      multiple={false}
      accept={{
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
        'text/csv': ['.csv'],
      }}
      onConvert={handleConvert}
    />
  );
}
