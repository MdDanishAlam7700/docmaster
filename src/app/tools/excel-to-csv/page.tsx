'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileSpreadsheet } from 'lucide-react';
import { excelToCsv } from '@/lib/converters/excel-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function ExcelToCsvPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return excelToCsv(files[0].file);
  };

  return (
    <ToolPageTemplate
      title="Excel to CSV"
      description="Export Excel sheets to CSV format."
      icon={<FileSpreadsheet className="h-7 w-7" />}
      multiple={false}
      accept={{
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
      }}
      onConvert={handleConvert}
    />
  );
}
