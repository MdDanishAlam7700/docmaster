'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Table } from 'lucide-react';
import { imageToText } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function ImageToExcelPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const result = await imageToText(files[0].file);
    const text = await result.file.text();
    const blob = new Blob([text], { type: 'text/csv' });
    return {
      file: blob,
      filename: files[0].name.replace(/\.[^/.]+$/, '.csv'),
      mimeType: 'text/csv',
    };
  };

  return (
    <ToolPageTemplate
      title="Image to Excel"
      description="Extract table data from images to Excel spreadsheets."
      icon={<Table className="h-7 w-7" />}
      multiple={false}
      accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'] }}
      onConvert={handleConvert}
    />
  );
}
