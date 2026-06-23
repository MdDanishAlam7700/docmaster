'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileSpreadsheet } from 'lucide-react';
import { excelToHtml } from '@/lib/converters/excel-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function ExcelToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const htmlResult = await excelToHtml(files[0].file);
    const html = await htmlResult.file.text();
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const lines = pdf.splitTextToSize(text, 180);
    pdf.text(lines, 15, 15);
    const blob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
    return {
      file: blob,
      filename: files[0].name.replace(/\.[^.]+$/, '.pdf'),
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="Excel to PDF"
      description="Convert Excel spreadsheets to PDF."
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
