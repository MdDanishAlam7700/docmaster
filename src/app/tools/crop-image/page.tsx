'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Crop } from 'lucide-react';
import { cropImage } from '@/lib/converters/image-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CropImagePage() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [width, setWidth] = useState(200);
  const [height, setHeight] = useState(200);

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return cropImage(files[0].file, x, y, width, height);
  };

  return (
    <ToolPageTemplate
      title="Crop Image"
      description="Cut and crop specific areas from images."
      icon={<Crop className="h-7 w-7" />}
      multiple={false}
      accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'] }}
      onConvert={handleConvert}
      options={
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="crop-x">X Offset (px)</Label>
            <Input
              id="crop-x"
              type="number"
              min={0}
              value={x}
              onChange={(e) => setX(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="crop-y">Y Offset (px)</Label>
            <Input
              id="crop-y"
              type="number"
              min={0}
              value={y}
              onChange={(e) => setY(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="crop-w">Width (px)</Label>
            <Input
              id="crop-w"
              type="number"
              min={1}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="crop-h">Height (px)</Label>
            <Input
              id="crop-h"
              type="number"
              min={1}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
          </div>
        </div>
      }
    />
  );
}
