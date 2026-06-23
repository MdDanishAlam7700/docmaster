'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileSpreadsheet } from 'lucide-react';
import { excelToHtml } from '@/lib/converters/excel-converter';
import { renderHtmlToPdf } from '@/lib/converters/html-to-pdf';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function ExcelToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const htmlResult = await excelToHtml(files[0].file);
    const html = await htmlResult.file.text();
    return renderHtmlToPdf(html, files[0].name);
  };

  return (
    <ToolPageTemplate
      title="Excel to PDF"
      description="Convert Excel spreadsheets to PDF with full formatting preserved."
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
