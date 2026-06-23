'use client';

import { useState } from 'react';
import { GitCompareArrows } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadedFile } from '@/lib/types';
import { getFileCategory, generateId } from '@/lib/utils';

export default function ComparePdf() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const handleFileChange = (index: number, file: File | null) => {
    if (!file) return;
    const updated = [...files];
    updated[index] = { id: generateId(), file, name: file.name, size: file.size, type: file.type, category: getFileCategory(file.name) };
    setFiles(updated);
    setResult(null);
  };

  const handleCompare = async () => {
    setResult('PDF comparison requires server-side processing to diff actual page content. Try viewing both files side by side manually.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/80 to-primary shadow-lg mb-2 [&_svg]:text-primary-foreground">
          <GitCompareArrows className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Compare PDF</h1>
        <p className="text-muted-foreground">Compare two PDF files side by side.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PDF File 1</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(0, e.target.files?.[0] || null)}
              className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
            {files[0] && <p className="text-xs text-muted-foreground mt-1">{files[0].name}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PDF File 2</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(1, e.target.files?.[0] || null)}
              className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
            {files[1] && <p className="text-xs text-muted-foreground mt-1">{files[1].name}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-3">
        <Button disabled={files.length < 2} className="px-8" onClick={handleCompare}>
          Compare PDFs
        </Button>
        {result && (
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">{result}</p>
        )}
      </div>
    </div>
  );
}
