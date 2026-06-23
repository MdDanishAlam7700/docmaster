'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { RotateCw } from 'lucide-react';
import { rotatePdf } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RotatePdfPage() {
  const [angle, setAngle] = useState('90');

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return rotatePdf(files[0].file, parseInt(angle));
  };

  return (
    <ToolPageTemplate
      title="Rotate PDF"
      description="Rotate all pages in your PDF to the correct orientation."
      icon={<RotateCw className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-2">
          <Label>Rotation Angle</Label>
          <Select value={angle} onValueChange={(v) => v && setAngle(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90">90° Clockwise</SelectItem>
              <SelectItem value="180">180°</SelectItem>
              <SelectItem value="270">90° Counter-clockwise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    />
  );
}
