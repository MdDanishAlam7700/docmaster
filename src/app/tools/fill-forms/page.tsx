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
    for (const field of fields) {
      const type = field.constructor.name;
      if (type.includes('TextField')) {
        try { (field as any).setText('[Filled]'); } catch {}
      } else if (type.includes('CheckBox')) {
        try { (field as any).check(); } catch {}
      } else if (type.includes('RadioGroup')) {
        try { (field as any).select((field as any).getOptions()?.[0]); } catch {}
      }
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
