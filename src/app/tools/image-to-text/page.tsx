'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { ScanText } from 'lucide-react';
import { imageToText } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function ImageToTextPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return imageToText(files[0].file);
  };

  return (
    <ToolPageTemplate
      title="Image to Text"
      description="Extract text from any image using OCR technology."
      icon={<ScanText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'] }}
      onConvert={handleConvert}
    />
  );
}
