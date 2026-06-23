'use client';

import { useState, useCallback } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Unlock } from 'lucide-react';
import { unlockPdf } from '@/lib/converters';
import { UploadedFile, ConversionResult, ConverterOptions } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function UnlockPdfPage() {
  const [password, setPassword] = useState('');

  const handleConvert = useCallback(async (
    files: UploadedFile[],
    opts?: ConverterOptions
  ): Promise<ConversionResult> => {
    return unlockPdf(files[0].file, password || undefined);
  }, [password]);

  return (
    <ToolPageTemplate
      title="Unlock PDF"
      description="Remove password protection from a PDF file."
      icon={<Unlock className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-2">
          <Label htmlFor="pdf-password">PDF Password</Label>
          <Input
            id="pdf-password"
            type="password"
            placeholder="Enter the document password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">The password will not be stored or transmitted.</p>
        </div>
      }
    />
  );
}
