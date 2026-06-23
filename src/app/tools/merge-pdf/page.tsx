'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Combine } from 'lucide-react';
import { mergePdfs } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function MergePdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const pdfFiles = files.map(f => f.file);
    return mergePdfs(pdfFiles);
  };

  return (
    <ToolPageTemplate
      title="Merge PDF"
      description="Combine multiple PDF files into a single document. Drag to reorder."
      icon={<Combine className="h-7 w-7" />}
      multiple={true}
      maxFiles={20}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
