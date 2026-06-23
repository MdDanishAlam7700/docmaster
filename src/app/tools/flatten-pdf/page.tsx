'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Layers } from 'lucide-react';
import { flattenPdf } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function FlattenPdf() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return flattenPdf(files[0].file);
  };

  return (
    <ToolPageTemplate
      title="Flatten PDF"
      description="Flatten PDF form fields and annotations into static content."
      icon={<Layers className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
