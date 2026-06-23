'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { ArrowRightLeft } from 'lucide-react';
import { excelToHtml } from '@/lib/converters/excel-converter';
import { htmlToDocx } from '@/lib/converters/docx-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function ExcelToWordPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const htmlResult = await excelToHtml(files[0].file);
    const html = await htmlResult.file.text();
    return htmlToDocx(html, files[0].name);
  };

  return (
    <ToolPageTemplate
      title="Excel to Word"
      description="Convert Excel data to Word documents."
      icon={<ArrowRightLeft className="h-7 w-7" />}
      multiple={false}
      accept={{
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
      }}
      onConvert={handleConvert}
    />
  );
}
