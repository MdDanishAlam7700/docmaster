'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileCode } from 'lucide-react';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function SvgToPdfPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const svgText = await files[0].file.text();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG'));
      img.src = url;
    });
    canvas.width = Math.min(img.width || 800, 1920);
    canvas.height = Math.min(img.height || 600, 1080);
    if (img.width) ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const dataUrl = canvas.toDataURL('image/png');
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: img.width > img.height ? 'landscape' : 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(dataUrl, 'PNG', 0, 0, canvas.width, canvas.height);
    const blob = new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
    return {
      file: blob,
      filename: files[0].name.replace(/\.[^.]+$/, '.pdf'),
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="SVG to PDF"
      description="Convert SVG vector graphics to PDF documents."
      icon={<FileCode className="h-7 w-7" />}
      multiple={false}
      accept={{ 'image/svg+xml': ['.svg'] }}
      onConvert={handleConvert}
    />
  );
}
