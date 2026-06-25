'use client';

import { useState, useCallback, useRef } from 'react';
import { FileUploader } from './FileUploader';
import { ResultPanel } from './ResultPanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConversionProgress, ConversionResult, ConverterOptions, UploadedFile } from '@/lib/types';
import { Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

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
      <ScrollReveal className="text-center space-y-2 relative" delay={0}>
        <Link
          href="/"
          className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg mb-2 [&_svg]:text-primary-foreground">
          {icon}
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <Card className="p-6 space-y-6 glass-card rounded-3xl bg-card/75 dark:bg-[#122131]/45 border-primary/10 dark:border-white/5 shadow-xl">
          <FileUploader
            files={files}
            onFilesChange={setFiles}
            accept={accept}
            multiple={multiple}
            maxFiles={maxFiles}
          />

          {options && files.length > 0 && progress.status === 'idle' && (
            <div className="space-y-4 p-4 rounded-xl bg-muted/40 border border-border/20">
              {typeof options === 'function' ? options(files) : options}
            </div>
          )}

          {files.length > 0 && progress.status === 'idle' && (
            <Button 
              onClick={handleConvert} 
              className="w-full bg-neon-gradient hover:scale-[1.01] hover:shadow-lg transition-all duration-300 font-bold h-12 rounded-xl text-primary-foreground border-none cursor-pointer" 
              size="lg"
            >
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
      </ScrollReveal>
    </div>
  );
}
