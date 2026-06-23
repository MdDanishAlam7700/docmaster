'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileText } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

function htmlToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  let md = '';

  function processNode(node: Node, depth: number) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim() || md.endsWith('\n')) {
        md += text;
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'h1') { md += '# ' + el.textContent + '\n\n'; }
    else if (tag === 'h2') { md += '## ' + el.textContent + '\n\n'; }
    else if (tag === 'h3') { md += '### ' + el.textContent + '\n\n'; }
    else if (tag === 'h4') { md += '#### ' + el.textContent + '\n\n'; }
    else if (tag === 'h5') { md += '##### ' + el.textContent + '\n\n'; }
    else if (tag === 'h6') { md += '###### ' + el.textContent + '\n\n'; }
    else if (tag === 'p') {
      for (const child of el.childNodes) processNode(child, depth);
      md += '\n\n';
    }
    else if (tag === 'br') { md += '\n'; }
    else if (tag === 'hr') { md += '---\n\n'; }
    else if (tag === 'strong' || tag === 'b') { md += '**' + el.textContent + '**'; }
    else if (tag === 'em' || tag === 'i') { md += '*' + el.textContent + '*'; }
    else if (tag === 'code') { md += '`' + el.textContent + '`'; }
    else if (tag === 'a') {
      const href = el.getAttribute('href') || '';
      md += '[' + el.textContent + '](' + href + ')';
    }
    else if (tag === 'img') {
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      md += '![' + alt + '](' + src + ')';
    }
    else if (tag === 'ul') {
      for (const child of el.childNodes) {
        if ((child as HTMLElement).tagName?.toLowerCase() === 'li') {
          md += '- ';
          for (const c of (child as HTMLElement).childNodes) processNode(c, depth + 1);
          md += '\n';
        }
      }
      md += '\n';
    }
    else if (tag === 'ol') {
      let idx = 1;
      for (const child of el.childNodes) {
        if ((child as HTMLElement).tagName?.toLowerCase() === 'li') {
          md += idx + '. ';
          for (const c of (child as HTMLElement).childNodes) processNode(c, depth + 1);
          md += '\n';
          idx++;
        }
      }
      md += '\n';
    }
    else if (tag === 'blockquote') {
      const text = el.textContent?.trim();
      if (text) {
        md += '> ' + text + '\n\n';
      }
    }
    else if (tag === 'pre') {
      const code = el.querySelector('code');
      const text = code ? code.textContent || '' : el.textContent || '';
      md += '```\n' + text.replace(/\n$/, '') + '\n```\n\n';
    }
    else if (tag === 'table') {
      const rows = Array.from(el.querySelectorAll('tr'));
      if (rows.length === 0) return;
      // Header row
      const headerCells = Array.from(rows[0].querySelectorAll('th, td'));
      md += '| ' + headerCells.map(c => c.textContent?.trim() || '').join(' | ') + ' |\n';
      md += '| ' + headerCells.map(() => '---').join(' | ') + ' |\n';
      for (let i = 1; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll('td'));
        md += '| ' + cells.map(c => c.textContent?.trim() || '').join(' | ') + ' |\n';
      }
      md += '\n';
    }
    else if (tag === 'div' || tag === 'span' || tag === 'section' || tag === 'article' || tag === 'main' || tag === 'body') {
      for (const child of el.childNodes) processNode(child, depth);
    }
  }

  processNode(doc.body, 0);

  // Clean up excessive newlines
  return md.replace(/\n{3,}/g, '\n\n').trim();
}

export default function HtmlToMarkdownPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const html = await files[0].file.text();
    const md = htmlToMarkdown(html);
    return {
      file: new Blob([md], { type: 'text/markdown' }),
      filename: files[0].name.replace(/\.[^.]+$/, '.md'),
      mimeType: 'text/markdown',
    };
  };

  return (
    <ToolPageTemplate
      title="HTML to Markdown"
      description="Convert HTML to clean Markdown format with proper structure."
      icon={<FileText className="h-7 w-7" />}
      multiple={false}
      accept={{ 'text/html': ['.html', '.htm'] }}
      onConvert={handleConvert}
    />
  );
}
