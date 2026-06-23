'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { ArrowRightLeft } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function WordToPowerPointPage() {
  const handleConvert = async (_files: UploadedFile[]): Promise<ConversionResult> => {
    throw new Error('Word to PowerPoint conversion requires server-side processing and is not available in this browser-only version.');
  };

  return (
    <ToolPageTemplate
      title="Word to PowerPoint"
      description="Convert Word outline to PowerPoint presentation."
      icon={<ArrowRightLeft className="h-7 w-7" />}
      multiple={false}
      accept={{
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/msword': ['.doc'],
      }}
      onConvert={handleConvert}
    />
  );
}
