'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrCode, Download } from 'lucide-react';
import QRCode from 'qrcode';

export default function QrGeneratorPage() {
  const [input, setInput] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!input) {
      setQrUrl('');
      return;
    }
    QRCode.toDataURL(input, { width: 300, margin: 2 }, (err, url) => {
      if (!err) setQrUrl(url);
    });
  }, [input]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = 'qrcode.png';
    link.click();
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <QrCode className="h-7 w-7" />
          <h1 className="text-3xl font-bold">QR Code Generator</h1>
        </div>
        <p className="text-muted-foreground">
          Generate QR codes from text or URLs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enter Content</CardTitle>
          <CardDescription>Enter any text or URL to generate a QR code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="https://example.com or any text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          {qrUrl && (
            <div className="flex flex-col items-center gap-4">
              <canvas ref={canvasRef} className="hidden" />
              <img src={qrUrl} alt="QR Code" className="rounded-lg border" />
              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
