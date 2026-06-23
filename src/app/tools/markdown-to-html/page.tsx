'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function MarkdownToHtmlPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const md = await files[0].file.text();
    const markdownIt = (await import('markdown-it')).default;
    const mdParser = new markdownIt({ html: true, linkify: true, typographer: true });
    const bodyHtml = mdParser.render(md);
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${files[0].name}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6;color:#333}
    pre{background:#f4f4f4;padding:16px;border-radius:6px;overflow-x:auto;margin:16px 0}
    code{background:#f4f4f4;padding:2px 6px;border-radius:3px;font-size:0.9em}
    pre code{background:none;padding:0}
    table{border-collapse:collapse;width:100%;margin:16px 0}
    th,td{border:1px solid #ddd;padding:8px;text-align:left}
    th{background:#f5f5f5;font-weight:bold}
    img{max-width:100%}
    blockquote{border-left:4px solid #ddd;margin:16px 0;padding:8px 16px;color:#666}
    ul,ol{margin:8px 0;padding-left:24px}
    h1,h2,h3,h4{margin-top:24px;margin-bottom:12px}
    a{color:#0066cc}
    @media(prefers-color-scheme:dark){body{background:#1a1a1a;color:#e0e0e0}pre,code{background:#2a2a2a}th{background:#2a2a2a}td,th{border-color:#444}blockquote{border-left-color:#555;color:#aaa}a{color:#66b0ff}}
  </style>
</head>
<body>${bodyHtml}</body>
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
      description="Convert Markdown to HTML web page with full syntax support."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'text/markdown': ['.md'], 'text/plain': ['.md'] }}
      onConvert={handleConvert}
    />
  );
}
