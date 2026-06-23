'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calculator, Upload } from 'lucide-react';

export default function WordCounterPage() {
  const [text, setText] = useState('');

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setText(ev.target?.result as string);
    };
    reader.readAsText(file);
  }, []);

  const stats = {
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    lines: text ? text.split('\n').length : 0,
    paragraphs: text.trim() ? text.trim().split(/\n\s*\n/).length : 0,
    sentences: text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary">
          <Calculator className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Word Counter</h1>
        <p className="text-muted-foreground">
          Count words, characters, lines, and paragraphs in any text.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Words', value: stats.words },
          { label: 'Characters', value: stats.characters },
          { label: 'No Spaces', value: stats.charactersNoSpaces },
          { label: 'Lines', value: stats.lines },
          { label: 'Paragraphs', value: stats.paragraphs },
          { label: 'Sentences', value: stats.sentences },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-1">
              <CardDescription className="text-xs">{stat.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
          <CardDescription>Type, paste text, or upload a file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('file-upload')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <span className="text-xs text-muted-foreground">.txt, .md, .csv, .html, .json</span>
              <input
                id="file-upload"
                type="file"
                accept=".txt,.md,.csv,.html,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          <Textarea
            placeholder="Start typing or paste your text here..."
            className="min-h-[300px] font-mono text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
