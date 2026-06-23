'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { extractPdfText } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function PdfToTextPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return extractPdfText(files[0].file);
  };

  return (
    <ToolPageTemplate
      title="PDF to Text"
      description="Extract plain text from PDF documents."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
