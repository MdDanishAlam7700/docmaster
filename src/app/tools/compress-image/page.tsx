'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Shrink } from 'lucide-react';
import { compressImage } from '@/lib/converters/image-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export default function CompressImagePage() {
  const [quality, setQuality] = useState(70);

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return compressImage(files[0].file, quality);
  };

  return (
    <ToolPageTemplate
      title="Compress Image"
      description="Reduce image file size significantly while maintaining quality."
      icon={<Shrink className="h-7 w-7" />}
      multiple={false}
      accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Quality: {quality}%</Label>
          </div>
          <Slider
            min={10}
            max={100}
            step={1}
            value={[quality]}
            onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Smaller file</span>
            <span>Higher quality</span>
          </div>
        </div>
      }
    />
  );
}
