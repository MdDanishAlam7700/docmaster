'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { PageThumbnailList } from '@/components/converter/PageThumbnailList';
import { Trash2 } from 'lucide-react';
import { deletePages } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function DeletePagesPage() {
  const selectedRef = useRef<Set<number>>(new Set());

  const handleConvert = useCallback(async (files: UploadedFile[]): Promise<ConversionResult> => {
    const indices = Array.from(selectedRef.current).map(i => i + 1);
    if (indices.length === 0) throw new Error('Select at least one page to delete.');
    return deletePages(files[0].file, indices);
  }, []);

  const handleSelectionChange = useCallback((s: Set<number>) => {
    selectedRef.current = s;
  }, []);

  return (
    <ToolPageTemplate
      title="Delete Pages"
      description="Select pages to remove from your PDF document."
      icon={<Trash2 className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={(files) => (
        <div className="space-y-3">
          <PageThumbnailList
            file={files[0].file}
            selectable
            onSelectionChange={handleSelectionChange}
          />
        </div>
      )}
    />
  );
}
