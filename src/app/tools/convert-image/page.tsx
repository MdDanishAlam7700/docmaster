'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Palette } from 'lucide-react';
import { convertImageFormat } from '@/lib/converters/image-converter';
import { UploadedFile, ConversionResult } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ConvertImagePage() {
  const [format, setFormat] = useState<string>('png');

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return convertImageFormat(files[0].file, format as 'png' | 'jpeg' | 'webp');
  };

  return (
    <ToolPageTemplate
      title="Convert Image"
      description="Convert between image formats (PNG, JPG, WebP)."
      icon={<Palette className="h-7 w-7" />}
      multiple={false}
      accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-2">
          <Label>Target Format</Label>
          <Select value={format} onValueChange={(v) => v && setFormat(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    />
  );
}
