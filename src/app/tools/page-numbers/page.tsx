'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Hash } from 'lucide-react';
import { addPageNumbers } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PageNumbers() {
  const [position, setPosition] = useState<string>('bottom-center');

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return addPageNumbers(files[0].file, position as 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center');
  };

  return (
    <ToolPageTemplate
      title="Add Page Numbers"
      description="Add page numbers to your PDF document."
      icon={<Hash className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-2">
          <Label>Position</Label>
          <Select value={position} onValueChange={(v) => v && setPosition(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-center">Bottom Center</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
              <SelectItem value="top-center">Top Center</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    />
  );
}
