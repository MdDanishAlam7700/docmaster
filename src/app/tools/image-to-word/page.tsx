'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { imageToText } from '@/lib/converters';
import { textToDocx } from '@/lib/converters/docx-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function ImageToWordPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const result = await imageToText(files[0].file);
    const text = await result.file.text();
    return textToDocx(text, files[0].name.replace(/\.[^/.]+$/, '') + '.docx');
  };

  return (
    <ToolPageTemplate
      title="Image to Word"
      description="Extract text from images and create editable Word documents."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'] }}
      onConvert={handleConvert}
    />
  );
}
