import { ConversionResult } from '@/lib/types';

export async function renderHtmlToPdf(html: string, filename: string): Promise<ConversionResult> {
  // html2pdf.js is a browser-only bundled library (includes html2canvas internally).
  // We import it dynamically to ensure it only runs client-side.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2pdf = (await import('html2pdf.js' as any)).default as any;

  // Create an isolated container element to render the HTML
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.background = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '12px';
  container.style.lineHeight = '1.5';
  container.style.padding = '20px';
  container.innerHTML = html;
  document.body.appendChild(container);

  // Preserve any inline styles and layout by copying document stylesheets
  const styleEls = document.querySelectorAll('link[rel="stylesheet"], style');
  styleEls.forEach((el) => {
    try {
      container.prepend(el.cloneNode(true));
    } catch {
      // ignore cross-origin errors
    }
  });

  const name = filename.replace(/\.[^.]+$/, '.pdf');

  const options = {
    margin: [10, 10, 10, 10],
    filename: name,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  try {
    const pdfBlob: Blob = await html2pdf().set(options).from(container).outputPdf('blob');
    return {
      file: pdfBlob,
      filename: name,
      mimeType: 'application/pdf',
    };
  } finally {
    document.body.removeChild(container);
  }
}
