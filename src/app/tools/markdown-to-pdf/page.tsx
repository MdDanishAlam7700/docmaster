'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { renderHtmlToPdf } from '@/lib/converters/html-to-pdf';
import { UploadedFile, ConversionResult } from '@/lib/types';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

export default function MarkdownToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const mdText = await files[0].file.text();
    const htmlContent = md.render(mdText);
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6;}h1,h2,h3{margin-top:24px;}code{background:#f4f4f4;padding:2px 6px;border-radius:3px;}pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto;}table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px;text-align:left;}blockquote{border-left:4px solid #ddd;margin:0;padding:0 16px;color:#666;}</style></head><body>${htmlContent}</body></html>`;
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
