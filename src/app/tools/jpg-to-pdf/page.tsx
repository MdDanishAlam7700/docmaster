'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Image } from 'lucide-react';
import { imagesToPdf } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function JpgToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const fileObjects = files.map(f => f.file);
    return imagesToPdf(fileObjects);
  };

  return (
    <ToolPageTemplate
      title="JPG to PDF"
      description="Convert JPEG images to PDF documents."
      icon={<Image className="h-7 w-7" />}
      multiple={true}
      accept={{ 'image/jpeg': ['.jpg', '.jpeg'] }}
      onConvert={handleConvert}
    />
  );
}
