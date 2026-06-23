'use client';

import { useState } from 'react';
import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { Lock } from 'lucide-react';
import { protectPdf } from '@/lib/converters';
import { UploadedFile, ConversionResult } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ProtectPdf() {
  const [password, setPassword] = useState('');

  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    return protectPdf(files[0].file, password);
  };

  return (
    <ToolPageTemplate
      title="Protect PDF"
      description="Add password protection to your PDF file."
      icon={<Lock className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
      options={
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
        </div>
      }
    />
  );
}
