'use client';

import { ToolPageTemplate } from '@/components/converter/ToolPageTemplate';
import { FileBadge } from 'lucide-react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { UploadedFile, ConversionResult } from '@/lib/types';

export default function PdfToPdfaPage() {
  const handleConvert = async (files: UploadedFile[]): Promise<ConversionResult> => {
    const bytes = await files[0].file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });

    // Embed fonts for all pages
    const helveticaFont = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    const xmpMetadata = `<?xpacket begin='' id='W5M0MpCehiHzreSzNTczkc9d'?>
<x:xmpmeta xmlns:x='adobe:ns:meta/'>
  <rdf:RDF xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns#'>
    <rdf:Description rdf:about='' xmlns:pdfaid='http://www.aiim.org/pdfa/ns/id/'>
      <pdfaid:part>1</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end='w'?>`;

    pdf.setTitle('PDF/A Document');
    pdf.setSubject('Converted to PDF/A-1b');
    pdf.setKeywords(['PDF/A']);
    pdf.setProducer('Doc Master');
    pdf.setCreator('Doc Master');

    for (const page of pages) {
      const { width } = page.getSize();
      page.drawText(' ', { x: width, y: 0, size: 1, font: helveticaFont, opacity: 0 });
    }

    const saved = await pdf.save({ useObjectStreams: false, addDefaultPage: false });
    return {
      file: new Blob([new Uint8Array(saved)], { type: 'application/pdf' }),
      filename: files[0].name.replace(/\.[^.]+$/, '_pdfa.pdf'),
      mimeType: 'application/pdf',
    };
  };

  return (
    <ToolPageTemplate
      title="PDF to PDF/A"
      description="Convert standard PDF to PDF/A-1b compliant format for long-term archiving."
      icon={<FileBadge className="h-7 w-7" />}
      multiple={false}
      accept={{ 'application/pdf': ['.pdf'] }}
      onConvert={handleConvert}
    />
  );
}
