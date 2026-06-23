import { ConversionResult } from '@/lib/types';

export async function renderHtmlToPdf(html: string, filename: string): Promise<ConversionResult> {
  const { default: jspdf } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#fff;padding:20px;font-family:Arial,sans-serif;line-height:1.6;';
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: container.scrollWidth,
      height: container.scrollHeight,
      logging: false,
    });

    const pdf = new jspdf({ unit: 'mm', format: 'a4' });
    const pdfW = 210;
    const pdfH = 297;
    const margin = 10;
    const printableW = pdfW - (margin * 2);
    const printableH = pdfH - (margin * 2);

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const imgW = canvas.width;
    const imgH = canvas.height;
    
    // Scale ratio based on width to fit printable page area
    const ratio = printableW / imgW;
    const renderW = printableW;
    const renderH = imgH * ratio;
    const x = margin;

    if (renderH <= printableH) {
      pdf.addImage(imgData, 'JPEG', x, margin, renderW, renderH);
    } else {
      let remaining = imgH;
      let yOffset = 0;
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      
      const maxPageH = Math.floor(printableH / ratio); // page slice height in pixels

      while (remaining > 0) {
        const sliceH = Math.min(remaining, maxPageH);
        pageCanvas.height = sliceH;
        const pageCtx = pageCanvas.getContext('2d')!;
        
        // Draw the pixel slice from original canvas to temporary pageCanvas
        pageCtx.drawImage(canvas, 0, yOffset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        
        const pageData = pageCanvas.toDataURL('image/jpeg', 0.92);
        if (yOffset > 0) pdf.addPage();
        
        const renderSliceH = sliceH * ratio; // convert pixel height to mm
        pdf.addImage(pageData, 'JPEG', x, margin, renderW, renderSliceH);
        
        yOffset += sliceH;
        remaining -= sliceH;
      }
    }

    const name = filename.replace(/\.[^.]+$/, '.pdf');
    return {
      file: new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' }),
      filename: name,
      mimeType: 'application/pdf',
    };
  } finally {
    document.body.removeChild(container);
  }
}
