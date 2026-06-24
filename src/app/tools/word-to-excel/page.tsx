'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { ArrowRightLeft } from 'lucide-react';
import { docxToExcel } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function WordToExcelPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return docxToExcel(files[0].file);
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
