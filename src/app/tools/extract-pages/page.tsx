'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileOutput } from 'lucide-react';
import { extractPages } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ExtractPagesPage() {
  const [pages, setPages] = useState('1-3');

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const pageNums = pages.split(',').map(p => parseInt(p.trim())).filter(n => !isNaN(n));
    return extractPages(files[0].file, pageNums);
  };

  return (
    <ToolPageTemplate
      title="Extract Pages"
      description="Extract specific pages from a PDF into a new document."
      icon={<FileOutput className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-2">
          <Label htmlFor="pages">Pages to Extract</Label>
          <Input
            id="pages"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="e.g., 1, 3, 5-7"
          />
          <p className="text-xs text-muted-foreground">Enter page numbers separated by commas.</p>
        </div>
      }
    />
  );
}
