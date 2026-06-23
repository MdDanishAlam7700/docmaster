'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Table } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function PdfToExcelPage() {
  const handleConvert = async (_files: UploadedFile[]): Promise<ConversionResult> => {
    throw new Error('PDF to Excel requires complex table extraction logic not available in the browser. Try the PDF to Text tool and then import the text into Excel.');
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
