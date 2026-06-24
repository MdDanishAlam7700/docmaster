'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Table } from 'lucide-react';
import { pdfToExcel } from '@/lib/converters';
import { UploadedFile, ConversionResult, ConverterOptions } from '@/lib/types';

export default function PdfToExcelPage() {
  const handleConvert = async (files: UploadedFile[], opts?: ConverterOptions): Promise<ConversionResult> => {
    return pdfToExcel(files[0].file, opts);
  };

  return (
    <ToolPageTemplate
      title="PDF to Excel"
      description="Extract tables from PDF into Excel spreadsheets."
      icon={<Table className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
