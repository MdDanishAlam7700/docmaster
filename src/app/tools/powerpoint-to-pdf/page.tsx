'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Presentation } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function PowerPointToPdfPage() {
  const handleConvert = async (_files: UploadedFile[]): Promise<ConversionResult> => {
    throw new Error('PowerPoint to PDF conversion requires server-side processing and is not available in this browser-only version.');
  };

  return (
    <ToolPageTemplate
      title="PowerPoint to PDF"
      description="Convert PowerPoint presentations to PDF."
      icon={<Presentation className="h-7 w-7" />}
      multiple={false}
      accept={{
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
        'application/vnd.ms-powerpoint': ['.ppt'],
      }}
      onConvert={handleConvert}
    />
  );
}
