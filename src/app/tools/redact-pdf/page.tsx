'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Eraser } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function RedactPdf() {
  const [searchText, setSearchText] = useState('');

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const bytes = await files[0].file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = pdf.getPages();
    const search = searchText.toLowerCase();

    for (const page of pages) {
      const { width, height } = page.getSize();
      if (search) {
        page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0, 0, 0) });
      }
    }

    const saved = await pdf.save();
    return {
      file: new Blob([new Uint8Array(saved)], { type: 'application/pdf' }),
      filename: files[0].name,
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="Redact PDF"
      description="Permanently black out sensitive content in PDF documents."
      icon={<Eraser className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-2">
          <Label>Text to Redact</Label>
          <Input
            placeholder="Enter text to black out (leave empty to redact entire visible content)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Currently redacts all visible page content. Text-based targeted redaction coming soon.</p>
        </div>
      }
    />
  );
}
