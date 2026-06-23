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
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdfW = 210;
    const pdfH = 297;
    const imgW = canvas.width;
    const imgH = canvas.height;
    const ratio = Math.min(pdfW / imgW, pdfH / imgH);
    const renderW = imgW * ratio;
    const renderH = imgH * ratio;
    const x = (pdfW - renderW) / 2;

    if (renderH <= pdfH) {
      pdf.addImage(imgData, 'JPEG', x, 10, renderW, renderH);
    } else {
      let remaining = imgH;
      let yOffset = 0;
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = canvas.height;
      const pageCtx = pageCanvas.getContext('2d')!;

      while (remaining > 0) {
        const pageH = Math.min(remaining, pdfH / ratio);
        pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(canvas, 0, yOffset, canvas.width, pageH * ratio, 0, 0, canvas.width, pageH * ratio);
        const pageData = pageCanvas.toDataURL('image/jpeg', 0.92);
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(pageData, 'JPEG', x, 10, renderW, pageH * ratio);
        yOffset += pageH * ratio;
        remaining -= pageH;
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
