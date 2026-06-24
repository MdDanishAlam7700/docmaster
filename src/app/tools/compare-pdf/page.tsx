'use client';

import { useState } from 'react';
import { GitCompareArrows, ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadedFile } from '@/lib/types';
import { getFileCategory, generateId } from '@/lib/utils';
import { extractPdfText } from '@/lib/converters';
import Link from 'next/link';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

function diffLines(lines1: string[], lines2: string[]): DiffLine[] {
  const dp: number[][] = Array(lines1.length + 1)
    .fill(0)
    .map(() => Array(lines2.length + 1).fill(0));

  for (let i = 1; i <= lines1.length; i++) {
    for (let j = 1; j <= lines2.length; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = lines1.length;
  let j = lines2.length;
  const diff: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      diff.push({ type: 'unchanged', value: lines1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.push({ type: 'added', value: lines2[j - 1] });
      j--;
    } else {
      diff.push({ type: 'removed', value: lines1[i - 1] });
      i--;
    }
  }

  return diff.reverse();
}

export default function ComparePdf() {
  const [files, setFiles] = useState<(UploadedFile | null)[]>([null, null]);
  const [loading, setLoading] = useState(false);
  const [diffResults, setDiffResults] = useState<DiffLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (index: number, file: File | null) => {
    setError(null);
    const updated = [...files];
    if (file) {
      updated[index] = {
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        category: getFileCategory(file.name),
      };
    } else {
      updated[index] = null;
    }
    setFiles(updated);
    setDiffResults(null);
  };

  const handleCompare = async () => {
    const f0 = files[0];
    const f1 = files[1];
    if (!f0 || !f1) return;

    setLoading(true);
    setError(null);
    try {
      const res1 = await extractPdfText(f0.file);
      const res2 = await extractPdfText(f1.file);

      const text1 = await res1.file.text();
      const text2 = await res2.file.text();

      const lines1 = text1.split('\n').map(l => l.trimEnd());
      const lines2 = text2.split('\n').map(l => l.trimEnd());

      const diffs = diffLines(lines1, lines2);
      setDiffResults(diffs);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to compare PDFs');
    } finally {
      setLoading(false);
    }
  };

  const additions = diffResults?.filter(d => d.type === 'added').length || 0;
  const deletions = diffResults?.filter(d => d.type === 'removed').length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 relative">
        <Link
          href="/"
          className="absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/80 to-primary shadow-lg mb-2 [&_svg]:text-primary-foreground">
          <GitCompareArrows className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Compare PDF</h1>
        <p className="text-muted-foreground">Compare the text contents of two PDF documents client-side.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Original PDF (File 1)</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(0, e.target.files?.[0] || null)}
              className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
            {files[0] && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                <span className="font-medium truncate">{files[0].name}</span>
                <span>({(files[0].size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Modified PDF (File 2)</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(1, e.target.files?.[0] || null)}
              className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
            {files[1] && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                <span className="font-medium truncate">{files[1].name}</span>
                <span>({(files[1].size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button
          disabled={!files[0] || !files[1] || loading}
          className="px-8"
          onClick={handleCompare}
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Compare PDFs
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive text-sm max-w-lg mx-auto">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {diffResults && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50 border-b flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Comparison Results
            </CardTitle>
            <div className="flex gap-4 text-xs font-medium">
              <span className="text-green-600 dark:text-green-400">+{additions} lines</span>
              <span className="text-red-600 dark:text-red-400">-{deletions} lines</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-auto font-mono text-xs p-4 bg-muted/20 space-y-1">
              {diffResults.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground">The documents are identical.</p>
              ) : (
                diffResults.map((line, idx) => {
                  let lineClass = 'text-muted-foreground';
                  let prefix = ' ';
                  if (line.type === 'added') {
                    lineClass = 'bg-green-500/10 text-green-600 dark:text-green-400 font-semibold px-1 rounded';
                    prefix = '+';
                  } else if (line.type === 'removed') {
                    lineClass = 'bg-red-500/10 text-red-600 dark:text-red-400 font-semibold px-1 rounded line-through';
                    prefix = '-';
                  }
                  return (
                    <div key={idx} className={`whitespace-pre-wrap ${lineClass}`}>
                      <span className="opacity-50 select-none mr-2">{prefix}</span>
                      {line.value || ' '}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
