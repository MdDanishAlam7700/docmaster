'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { ClipboardCheck } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function FillForms() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const bytes = await files[0].file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const form = pdf.getForm();
    const fields = form.getFields();
    let filledCount = 0;
    for (const field of fields) {
      const type = field.constructor.name;
      try {
        if (type.includes('TextField')) {
          (field as any).setText('[Filled]');
          filledCount++;
        } else if (type.includes('CheckBox')) {
          (field as any).check();
          filledCount++;
        } else if (type.includes('RadioGroup')) {
          const opts = (field as any).getOptions?.();
          if (opts?.length) {
            (field as any).select(opts[0]);
            filledCount++;
          }
        }
      } catch {
        // Skip unsupported field types silently
      }
    }
    if (filledCount === 0) {
      throw new Error('No fillable form fields found in this PDF.');
    }
    const saved = await pdf.save({ useObjectStreams: false });
    return {
      file: new Blob([new Uint8Array(saved)], { type: 'application/pdf' }),
      filename: files[0].name,
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="Fill Forms"
      description="Fill in interactive PDF form fields automatically."
      icon={<ClipboardCheck className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
