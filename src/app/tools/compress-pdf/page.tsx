'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Minimize2 } from 'lucide-react';
import { compressPdf } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CompressPdfPage() {
  const [level, setLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return compressPdf(files[0].file, level);
  };

  return (
    <ToolPageTemplate
      title="Compress PDF"
      description="Reduce the file size of your PDF while maintaining quality."
      icon={<Minimize2 className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-2">
          <Label>Compression Level</Label>
          <Select value={level} onValueChange={(v) => v && setLevel(v as typeof level)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low — Best Quality</SelectItem>
              <SelectItem value="medium">Medium — Balanced</SelectItem>
              <SelectItem value="high">High — Smallest Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    />
  );
}
