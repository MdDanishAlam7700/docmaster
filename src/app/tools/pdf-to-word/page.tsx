'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { extractPdfText } from '@/lib/converters';
import { textToDocx } from '@/lib/converters/docx-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function PdfToWordPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const textResult = await extractPdfText(files[0].file);
    const text = await textResult.file.text();
    return textToDocx(text, files[0].name);
  };

  return (
    <ToolPageTemplate
      title="PDF to Word"
      description="Convert PDF to editable Word documents with formatting."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
