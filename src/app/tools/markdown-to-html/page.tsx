'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function MarkdownToHtmlPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const md = await files[0].file.text();
    const html = md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${files[0].name}</title>
  <style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6;}h1,h2,h3{margin-top:24px;}code{background:#f4f4f4;padding:2px 6px;border-radius:3px;}li{margin-left:20px;}</style>
</head>
<body>${html}</body>
</html>`;
    return {
      file: new Blob([fullHtml], { type: 'text/html' }),
      filename: files[0].name.replace(/\.[^.]+$/, '.html'),
      mimeType: 'text/html',
    };
  };

  return (
    <ToolPageTemplate
      title="Markdown to HTML"
      description="Convert Markdown to HTML web page."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'text/markdown': ['.md'], 'text/plain': ['.md'] }}
      onConvert={handleConvert}
    />
  );
}
