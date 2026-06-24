'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { PageThumbnailList } from '@/components/converter/PageThumbnailList';
import { GripVertical, RotateCcw } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { changeExtension } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PageInfo {
  index: number;
  src: string;
}

export default function ReorderPages() {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [hasReordered, setHasReordered] = useState(false);
  const orderRef = useRef<PageInfo[]>([]);

  const handleConvert = useCallback(async (files: UploadedFile[]): Promise<ConversionResult> => {
    const bytes = await files[0].file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });

    const ordered = orderRef.current.length > 0 ? orderRef.current : pages;
    const indices = ordered.map(p => p.index);

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, indices);
    copiedPages.forEach(p => newPdf.addPage(p));
    const saved = await newPdf.save();

    return {
      file: new Blob([new Uint8Array(saved)], { type: 'application/pdf' }),
      filename: changeExtension(files[0].name, 'pdf'),
      mimeType: 'application/pdf',
    };
  }, [pages]);

  const handleOrderChange = useCallback((reordered: PageInfo[]) => {
    orderRef.current = reordered;
    setPages(reordered);
    setHasReordered(true);
  }, []);

  const resetOrder = useCallback(() => {
    orderRef.current = [];
    setHasReordered(false);
  }, []);

  return (
    <ToolPageTemplate
      title="Reorder Pages"
      description="Drag and drop pages to rearrange them in your PDF."
      icon={<GripVertical className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={(files) => (
        <div className="space-y-3">
          <PageThumbnailList
            file={files[0].file}
            onOrderChange={handleOrderChange}
          />
          {hasReordered && (
            <Button variant="outline" size="sm" onClick={resetOrder} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Original Order
            </Button>
          )}
        </div>
      )}
    />
  );
}
