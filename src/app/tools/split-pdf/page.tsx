'use client';

import { useState, useCallback, useRef } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { PageThumbnailList } from '@/components/converter/PageThumbnailList';
import { Scissors } from 'lucide-react';
import { splitPdf } from '@/lib/converters';
import { UploadedFile, ConversionResult, ConverterOptions } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function SplitPdfPage() {
  const [ranges, setRanges] = useState('1-3');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const selectedRef = useRef<Set<number>>(new Set());

  const handleConvert = useCallback(async (
    files: UploadedFile[],
    opts?: ConverterOptions
  ): Promise<ConversionResult | ConversionResult[]> => {
    const useSelected = selectedRef.current.size > 0;
    const rangeStr = useSelected
      ? Array.from(selectedRef.current).map(i => `${i + 1}`).join(',')
      : ranges;
    return splitPdf(files[0].file, rangeStr, opts);
  }, [ranges]);

  const handleSelectionChange = useCallback((s: Set<number>) => {
    selectedRef.current = s;
    setSelected(s);
  }, []);

  return (
    <ToolPageTemplate
      title="Split PDF"
      description="Split a PDF into multiple files by selecting pages or entering ranges."
      icon={<Scissors className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={(files) => (
        <div className="space-y-4">
          <PageThumbnailList
            file={files[0].file}
            selectable
            selected={selected}
            onSelectionChange={handleSelectionChange}
          />

          <div className="space-y-2">
            <Label htmlFor="ranges">Or enter page ranges</Label>
            <Input
              id="ranges"
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="e.g., 1-3, 5, 7-10"
            />
            <p className="text-xs text-muted-foreground">
              {selected.size > 0
                ? `${selected.size} page(s) selected via checkboxes above`
                : 'Separate ranges with commas. Use hyphens for ranges.'}
            </p>
          </div>
        </div>
      )}
    />
  );
}
