'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Download, Loader2, CheckCircle2, AlertCircle, RotateCcw, FileText, ImageIcon, File, FileSpreadsheet } from 'lucide-react';
import { ConversionProgress, ConversionResult } from '@/lib/types';
import { downloadBlob, downloadMultipleFiles } from '@/lib/utils';

interface ResultPanelProps {
  progress: ConversionProgress;
  result: ConversionResult | ConversionResult[] | null;
  fileName?: string;
  onReset: () => void;
  onCancel?: () => void;
}

export function ResultPanel({ progress, result, fileName, onReset, onCancel }: ResultPanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>('');

  useEffect(() => {
    if (result && !Array.isArray(result)) {
      const url = URL.createObjectURL(result.file);
      setPreviewUrl(url);
      setPreviewType(result.mimeType);
      return () => {
        URL.revokeObjectURL(url);
        setPreviewUrl(null);
      };
    }
    setPreviewUrl(null);
  }, [result]);

  const handleDownload = () => {
    if (!result) return;
    if (Array.isArray(result)) {
      downloadMultipleFiles(result.map(r => ({ file: r.file, filename: r.filename })));
    } else {
      downloadBlob(result.file, result.filename);
    }
  };

  if (progress.status === 'idle') return null;

  return (
    <div className="p-4 md:p-6 rounded-2xl border border-dashed border-border/40 bg-accent/25 animate-in fade-in duration-200">
      <div className="space-y-4">
        {progress.status === 'processing' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-semibold">{progress.message || 'Processing...'}</p>
              <Button variant="outline" size="sm" onClick={onCancel} className="ml-auto rounded-xl">
                Cancel
              </Button>
            </div>
            <Progress value={progress.progress} className="h-2" />
            {progress.total && (
              <p className="text-xs text-muted-foreground">Page {progress.current} of {progress.total}</p>
            )}
          </div>
        )}

        {progress.status === 'error' && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Conversion Failed</p>
              <p className="text-sm mt-1">{progress.error || 'An unknown error occurred'}</p>
            </div>
          </div>
        )}

        {progress.status === 'cancelled' && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border/20">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Conversion cancelled.</p>
          </div>
        )}

        {progress.status === 'complete' && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-semibold">
                {Array.isArray(result)
                  ? `${result.length} files converted successfully`
                  : 'Conversion complete'}
              </p>
            </div>

            {previewUrl && (
              <>
                {previewType.startsWith('image/') && (
                  <div className="rounded-xl overflow-hidden border border-border/30 bg-muted/20">
                    <img src={previewUrl} alt="Preview" className="max-h-64 w-full object-contain bg-muted" />
                  </div>
                )}

                {previewType === 'text/plain' && (
                  <div className="rounded-xl border border-border/30 bg-muted/20 p-4 max-h-48 overflow-auto font-mono text-xs">
                    <PreviewText url={previewUrl} />
                  </div>
                )}

                {previewType === 'text/html' && (
                  <div className="rounded-xl border border-border/30 bg-muted/20 p-4 max-h-64 overflow-auto">
                    <PreviewText url={previewUrl} preview />
                  </div>
                )}

                {previewType === 'application/pdf' && (
                  <div className="rounded-xl overflow-hidden border border-border/30 bg-muted/20">
                    <embed
                      src={previewUrl}
                      type="application/pdf"
                      className="w-full h-96 bg-muted"
                    />
                  </div>
                )}

                {previewType === 'application/json' && (
                  <div className="rounded-xl border border-border/30 bg-muted/20 p-4 max-h-48 overflow-auto">
                    <PreviewText url={previewUrl} />
                  </div>
                )}

                {previewType === 'text/csv' && (
                  <div className="rounded-xl border border-border/30 bg-muted/20 p-4 max-h-48 overflow-auto font-mono text-xs">
                    <PreviewText url={previewUrl} />
                  </div>
                )}
              </>
            )}

            {!previewUrl && result && !Array.isArray(result) && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/20">
                <File className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-bold">{result.filename}</p>
                  <p className="text-xs">{(result.file.size / 1024).toFixed(1)} KB &middot; {result.mimeType}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleDownload} className="flex-1 bg-neon-gradient border-none rounded-xl text-primary-foreground font-semibold cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={onReset} className="rounded-xl border-primary/20 hover:bg-primary/5">
                <RotateCcw className="h-4 w-4 mr-2" />
                Convert Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewText({ url, preview }: { url: string; preview?: boolean }) {
  const [text, setText] = useState('');
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(r => { if (!cancelled) return r.text(); })
      .then(t => { if (!cancelled && t !== undefined) setText(t); })
      .catch(() => { if (!cancelled) setText('[Preview unavailable]'); });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);
  if (preview) {
    return <iframe srcDoc={text} className="w-full h-64 border-0" title="Preview" sandbox="" />;
  }
  return <pre className="text-xs whitespace-pre-wrap font-mono">{text.slice(0, 5000)}</pre>;
}
