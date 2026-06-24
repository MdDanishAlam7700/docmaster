'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { pdfToDocx } from '@/lib/converters';
import { UploadedFile, ConversionResult, ConverterOptions } from '@/lib/types';

export default function PdfToWordPage() {
  const handleConvert = async (files: UploadedFile[], opts?: ConverterOptions): Promise<ConversionResult> => {
    return pdfToDocx(files[0].file, opts);
  };

  return (
    <ToolPageTemplate
      title="PDF to Word"
      description="Convert PDF to Word documents with full visual fidelity — shapes, logos, colors, and layout are all preserved."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
