'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { renderHtmlToPdf } from '@/lib/converters/html-to-pdf';
import { FileText } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export default function TextToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const text = await files[0].file.text();
    const title = files[0].name.replace(/\.[^.]+$/, '');
    const lines = text.split('\n').filter(l => l.trim());
    const body = lines.map(l => `<p>${escapeHtml(l)}</p>`).join('\n');
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:Georgia,'Times New Roman',serif;margin:0;padding:40px;line-height:1.8;color:#222}
      h1{font-size:24px;margin-bottom:4px;border-bottom:2px solid #333;padding-bottom:8px}
      .meta{font-size:12px;color:#888;margin-bottom:24px;font-family:sans-serif}
      p{font-size:12pt;margin:0 0 8px;text-align:justify;orphans:3;widows:3}
      @media(prefers-color-scheme:dark){body{color:#ddd}h1{border-color:#666}.meta{color:#999}}
      @page{margin:20mm}
    </style></head><body>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">${lines.length} lines &middot; ${text.length} characters</div>
    ${body}
    </body></html>`;
    return renderHtmlToPdf(fullHtml, files[0].name);
  };

  return (
    <ToolPageTemplate
      title="Text to PDF"
      description="Convert plain text files to beautifully formatted PDF with proper typography."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'text/plain': ['.txt'] }}
      onConvert={handleConvert}
    />
  );
}
