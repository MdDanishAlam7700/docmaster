'use client';

import { useState } from 'react';
import { FileUploader } from '@/components/converter/FileUploader';
import { ResultPanel } from '@/components/converter/ResultPanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScanText, Zap, Loader2 } from 'lucide-react';
import { UploadedFile, ConversionResult, ConversionProgress } from '@/lib/types';
import { ocrPdf } from '@/lib/converters';

export default function OcrPdfPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [progress, setProgress] = useState<ConversionProgress>({ status: 'idle', progress: 0 });
  const [result, setResult] = useState<ConversionResult | null>(null);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setResult(null);
    setProgress({ status: 'processing', progress: 0, message: 'Loading PDF...' });

    try {
      const res = await ocrPdf(files[0].file, (current, total) => {
        setProgress({
          status: 'processing',
          progress: Math.round((current / total) * 100),
          message: `OCR processing page ${current} of ${total}...`,
        });
      });
      setResult(res);
      setProgress({ status: 'complete', progress: 100 });
    } catch (err) {
      setProgress({
        status: 'error',
        progress: 0,
        error: err instanceof Error ? err.message : 'OCR processing failed',
      });
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setProgress({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/80 to-primary shadow-lg mb-2 [&_svg]:text-primary-foreground">
          <ScanText className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">OCR PDF</h1>
        <p className="text-muted-foreground">Make scanned PDF searchable with optical character recognition.</p>
      </div>

      <Card className="p-6 space-y-6">
        <FileUploader
          files={files}
          onFilesChange={setFiles}
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={false}
        />

        {files.length > 0 && progress.status === 'idle' && (
          <Button onClick={handleConvert} className="w-full" size="lg">
            <Zap className="h-4 w-4 mr-2" />
            OCR PDF
          </Button>
        )}

        {progress.status === 'processing' && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium">{progress.message}</p>
            </div>
            <Progress value={progress.progress} className="h-2" />
          </div>
        )}

        <ResultPanel
          progress={progress}
          result={result}
          fileName={files[0]?.name}
          onReset={handleReset}
        />
      </Card>
    </div>
  );
}
