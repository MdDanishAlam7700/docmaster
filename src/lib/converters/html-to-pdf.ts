import { ConversionResult } from '@/lib/types';

// Normalizes modern CSS color functions (oklch, oklab, lab, lch, color()) that
// html2canvas cannot parse into safe hex/rgb equivalents.
// We do this by rendering each color in an off-screen element and reading back
// the computed rgb() value that the browser resolves.
function resolveColor(cssValue: string): string {
  try {
    const el = document.createElement('div');
    el.style.display = 'none';
    el.style.color = cssValue;
    document.body.appendChild(el);
    const resolved = getComputedStyle(el).color; // always returns rgb() or rgba()
    document.body.removeChild(el);
    return resolved || '#000000';
  } catch {
    return '#000000';
  }
}

// Returns a safe <style> block with oklch/lab/lch/oklab/color() values converted
// to their rgb() equivalents so html2canvas can parse them.
function getSafeStyleBlock(styleText: string): string {
  // Replace oklch(...), oklab(...), lab(...), lch(...), color(...) with resolved rgb()
  return styleText.replace(
    /\b(oklch|oklab|lab|lch|color)\s*\([^)]+\)/gi,
    (match) => resolveColor(match),
  );
}

export async function renderHtmlToPdf(html: string, filename: string): Promise<ConversionResult> {
  // html2pdf.js is a browser-only bundled library (includes html2canvas internally).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2pdf = (await import('html2pdf.js' as any)).default as any;

  // Create an isolated container with safe, explicit hex styles.
  // We do NOT copy app stylesheets because they use oklch()/lab() colors
  // that html2canvas cannot parse — it throws "unsupported color function" errors.
  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'left:-99999px',
    'top:0',
    'width:800px',
    'background:#ffffff',
    'color:#000000',
    'font-family:Arial,Helvetica,sans-serif',
    'font-size:12px',
    'line-height:1.5',
    'padding:20px',
    'box-sizing:border-box',
  ].join(';');
  container.innerHTML = html;
  document.body.appendChild(container);

  // Inject only <style> blocks whose content is already safe (no modern color functions),
  // or sanitize them to rgb() equivalents before injecting.
  const styleEls = document.querySelectorAll<HTMLStyleElement>('style');
  styleEls.forEach((el) => {
    const text = el.textContent || '';
    // Skip app theme stylesheets that contain oklch/lab (they'd break html2canvas)
    if (/\b(oklch|oklab|lab|lch)\s*\(/i.test(text)) {
      // Inject a sanitized version with resolved rgb() values instead
      const safe = document.createElement('style');
      safe.textContent = getSafeStyleBlock(text);
      container.prepend(safe);
    } else {
      try {
        container.prepend(el.cloneNode(true));
      } catch {
        // cross-origin — skip
      }
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
      // Tell html2canvas to ignore CSS variables it can't resolve
      ignoreElements: (el: Element) => el.tagName === 'SCRIPT',
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
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
