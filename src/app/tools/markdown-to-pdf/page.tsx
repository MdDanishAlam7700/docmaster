'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { renderHtmlToPdf } from '@/lib/converters/html-to-pdf';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function MarkdownToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const mdText = await files[0].file.text();
    const htmlContent = mdText
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6;}h1,h2,h3{margin-top:24px;}code{background:#f4f4f4;padding:2px 6px;border-radius:3px;}</style></head><body>${htmlContent}</body></html>`;
    return renderHtmlToPdf(fullHtml, files[0].name);
  };

  return (
    <ToolPageTemplate
      title="Markdown to PDF"
      description="Convert Markdown files to styled PDF documents with full formatting."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'text/markdown': ['.md'], 'text/plain': ['.md'] }}
      onConvert={handleConvert}
    />
  );
}
