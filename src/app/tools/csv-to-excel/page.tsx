'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileSpreadsheet } from 'lucide-react';
import { csvToExcel } from '@/lib/converters/excel-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function CsvToExcelPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return csvToExcel(files[0].file);
  };

  return (
    <ToolPageTemplate
      title="CSV to Excel"
      description="Convert CSV files to Excel spreadsheets."
      icon={<FileSpreadsheet className="h-7 w-7" />}
      multiple={false}
      accept={{ 'text/csv': ['.csv'] }}
      onConvert={handleConvert}
    />
  );
}
