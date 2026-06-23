'use client';

import { useState, useCallback, useRef } from 'react';
import { FileUploader } from './FileUploader';
import { ResultPanel } from './ResultPanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConversionProgress, ConversionResult, ConverterOptions, UploadedFile } from '@/lib/types';
import { Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ToolPageTemplateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxFiles?: number;
  options?: React.ReactNode | ((files: UploadedFile[]) => React.ReactNode);
  onConvert: (files: UploadedFile[], options?: ConverterOptions) => Promise<ConversionResult | ConversionResult[]>;
}

export function ToolPageTemplate({
  title,
  description,
  icon,
  accept,
  multiple = false,
  maxFiles = 20,
  options,
  onConvert,
}: ToolPageTemplateProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [progress, setProgress] = useState<ConversionProgress>({ status: 'idle', progress: 0 });
  const [result, setResult] = useState<ConversionResult | ConversionResult[] | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return;
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
    setProgress({ status: 'processing', progress: 10, message: 'Starting...' });
    try {
      const res = await onConvert(files, { signal });
      if (signal.aborted) return;
      setResult(res);
      setProgress({ status: 'complete', progress: 100 });
    } catch (err: any) {
      if (err?.name === 'AbortError' || signal.aborted) {
        setProgress({ status: 'cancelled', progress: 0, message: 'Cancelled' });
        return;
      }
      setProgress({
        status: 'error',
        progress: 0,
        error: err instanceof Error ? err.message : 'Conversion failed',
      });
    }
  }, [files, onConvert]);

  const handleCancel = () => {
    controllerRef.current?.abort();
  };

  const handleReset = () => {
    controllerRef.current = null;
    setFiles([]);
    setResult(null);
    setProgress({ status: 'idle', progress: 0 });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/80 to-primary shadow-lg mb-2 [&_svg]:text-primary-foreground">
          {icon}
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card className="p-6 space-y-6">
        <FileUploader
          files={files}
          onFilesChange={setFiles}
          accept={accept}
          multiple={multiple}
          maxFiles={maxFiles}
        />

        {options && files.length > 0 && progress.status === 'idle' && (
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            {typeof options === 'function' ? options(files) : options}
          </div>
        )}

        {files.length > 0 && progress.status === 'idle' && (
          <Button onClick={handleConvert} className="w-full" size="lg">
            <Zap className="h-4 w-4 mr-2" />
            Convert {files.length > 1 ? `${files.length} Files` : 'File'}
          </Button>
        )}

        <ResultPanel
          progress={progress}
          result={result}
          fileName={files[0]?.name}
          onReset={handleReset}
          onCancel={handleCancel}
        />
      </Card>
    </div>
  );
}
