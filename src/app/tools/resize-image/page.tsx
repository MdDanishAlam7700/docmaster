'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Maximize } from 'lucide-react';
import { resizeImage } from '@/lib/converters/image-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResizeImagePage() {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [maintainAspect, setMaintainAspect] = useState(true);

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return resizeImage(files[0].file, width, height, maintainAspect);
  };

  return (
    <ToolPageTemplate
      title="Resize Image"
      description="Change image dimensions to any size."
      icon={<Maximize className="h-7 w-7" />}
      multiple={false}
      accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                min={1}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                min={1}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="aspect"
              checked={maintainAspect}
              onCheckedChange={(v) => setMaintainAspect(!!v)}
            />
            <Label htmlFor="aspect">Maintain aspect ratio</Label>
          </div>
        </div>
      }
    />
  );
}
