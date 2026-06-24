'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { LayoutTemplate } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { changeExtension } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function HeaderFooter() {
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('Page');

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const bytes = await files[0].file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();

      if (headerText.trim()) {
        page.drawText(headerText, {
          x: 30, y: height - 20, size: 9, font, color: rgb(0.4, 0.4, 0.4),
        });
      }

      if (footerText.trim()) {
        const text = footerText.trim().toLowerCase() === 'page' ? `Page ${index + 1}` : footerText;
        const tw = font.widthOfTextAtSize(text, 9);
        page.drawText(text, {
          x: (width - tw) / 2, y: 20, size: 9, font, color: rgb(0.4, 0.4, 0.4),
        });
      }
    });

    const saved = await pdf.save();
    return {
      file: new Blob([new Uint8Array(saved)], { type: 'application/pdf' }),
      filename: changeExtension(files[0].name, 'pdf'),
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="Header & Footer"
      description="Add custom header and footer text to every page of your PDF."
      icon={<LayoutTemplate className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Header Text</Label>
            <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="e.g., Confidential Document" />
          </div>
          <div className="space-y-2">
            <Label>Footer Text</Label>
            <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="e.g., Page or © 2026 Company" />
            <p className="text-xs text-muted-foreground">Type &quot;Page&quot; to auto-number pages (e.g., &quot;Page 1&quot;).</p>
          </div>
        </div>
      }
    />
  );
}
