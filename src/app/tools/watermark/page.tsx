'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Droplets } from 'lucide-react';
import { addWatermark } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

export default function Watermark() {
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState([0.3]);

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return addWatermark(files[0].file, text, opacity[0]);
  };

  return (
    <ToolPageTemplate
      title="Add Watermark"
      description="Add a text watermark overlay to your PDF."
      icon={<Droplets className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Watermark Text</Label>
            <Input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter watermark text" />
          </div>
          <div className="space-y-2">
            <Label>Opacity: {opacity[0].toFixed(1)}</Label>
            <Slider value={opacity} onValueChange={(v) => { if (Array.isArray(v)) setOpacity(v); }} min={0.1} max={1} step={0.1} />
          </div>
        </div>
      }
    />
  );
}
