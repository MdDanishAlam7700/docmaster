'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { PenTool } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function SignPdf() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const bytes = await files[0].file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    lastPage.drawRectangle({ x: width - 125, y: 20, width: 110, height: 35, borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 1, color: rgb(1, 1, 1) });
    lastPage.drawText('Digitally Signed', { x: width - 120, y: 40, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
    lastPage.drawText(`Signed: ${new Date().toLocaleDateString()}`, { x: width - 120, y: 28, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

    const saved = await pdf.save();
    return {
      file: new Blob([new Uint8Array(saved)], { type: 'application/pdf' }),
      filename: files[0].name,
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="Sign PDF"
      description="Add a digital signature block to PDF documents."
      icon={<PenTool className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
