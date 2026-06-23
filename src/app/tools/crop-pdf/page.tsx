'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Crop } from 'lucide-react';
import { cropPdf } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function CropPdf() {
  const [top, setTop] = useState(0);
  const [right, setRight] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [left, setLeft] = useState(0);

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return cropPdf(files[0].file, top, right, bottom, left);
  };

  return (
    <ToolPageTemplate
      title="Crop PDF"
      description="Crop PDF page margins to remove whitespace."
      icon={<Crop className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Top (pt)</Label>
            <Input type="number" value={top} onChange={(e) => setTop(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Right (pt)</Label>
            <Input type="number" value={right} onChange={(e) => setRight(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Bottom (pt)</Label>
            <Input type="number" value={bottom} onChange={(e) => setBottom(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Left (pt)</Label>
            <Input type="number" value={left} onChange={(e) => setLeft(Number(e.target.value))} />
          </div>
        </div>
      }
    />
  );
}
