'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { ArrowRightLeft } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function WordToExcelPage() {
  const handleConvert = async (_files: UploadedFile[]): Promise<ConversionResult> => {
    throw new Error('Word to Excel conversion requires server-side processing. Try converting Word to HTML first, then open in Excel.');
  };

  return (
    <ToolPageTemplate
      title="Word to Excel"
      description="Extract data from Word documents to Excel."
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
