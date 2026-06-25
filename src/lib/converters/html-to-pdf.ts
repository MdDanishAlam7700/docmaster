import { ConversionResult } from '@/lib/types';

// ─────────────────────────────────────────────────────────────
// Color helpers — html2canvas cannot parse modern CSS color
// functions (oklch, oklab, lab, lch).  We resolve them through
// the browser's own getComputedStyle first.
// ─────────────────────────────────────────────────────────────
function resolveColor(cssValue: string): string {
  try {
    const el = document.createElement('div');
    el.style.display = 'none';
    el.style.color = cssValue;
    document.body.appendChild(el);
    const resolved = getComputedStyle(el).color;
    document.body.removeChild(el);
    return resolved || '#000000';
  } catch {
    return '#000000';
  }
}

function getSafeStyleBlock(styleText: string): string {
  return styleText.replace(
    /\b(oklch|oklab|lab|lch|color)\s*\([^)]+\)/gi,
    (match) => resolveColor(match),
  );
}

// ─────────────────────────────────────────────────────────────
// Core HTML → PDF renderer
// ─────────────────────────────────────────────────────────────
export interface HtmlToPdfOptions {
  /** Page margin in mm on all sides.  Default: 10 */
  marginMm?: number;
  /** Force a specific page orientation.  Default: auto-detect. */
  orientation?: 'portrait' | 'landscape';
  /** JPEG quality 0–1.  Default: 0.95 */
  quality?: number;
  /** html2canvas render scale.  Default: 2 */
  scale?: number;
}

export async function renderHtmlToPdf(
  html: string,
  filename: string,
  opts: HtmlToPdfOptions = {},
): Promise<ConversionResult> {
  const {
    marginMm = 10,
    quality = 0.95,
    scale = 2,
  } = opts;

  // ── 1. Load html2pdf.js (bundles html2canvas internally) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2pdf = (await import('html2pdf.js' as any)).default as any;

  // ── 2. Build an off-screen render container ──────────────
  const container = document.createElement('div');

  // We set an explicit but wide initial width so tables aren't
  // crushed on narrow viewports.  We will shrink-wrap later.
  container.style.cssText = [
    'position:fixed',
    'left:-99999px',
    'top:0',
    // A4 content width at 96dpi with 10mm margin each side ≈ 754px
    // Use 1060px as the starting point so wide Excel tables render fully.
    'width:1060px',
    'background:#ffffff',
    'color:#000000',
    'font-family:Arial,Helvetica,sans-serif',
    'font-size:12px',
    'line-height:1.5',
    'padding:0',           // no padding — jsPDF margin handles whitespace
    'box-sizing:border-box',
    'overflow:visible',
  ].join(';');
  container.innerHTML = html;
  document.body.appendChild(container);

  // ── 3. Sanitize & inject <style> blocks ──────────────────
  // App theme styles use oklch() which html2canvas cannot parse.
  const styleEls = document.querySelectorAll<HTMLStyleElement>('style');
  styleEls.forEach((el) => {
    const text = el.textContent || '';
    if (/\b(oklch|oklab|lab|lch)\s*\(/i.test(text)) {
      const safe = document.createElement('style');
      safe.textContent = getSafeStyleBlock(text);
      container.prepend(safe);
    } else {
      try { container.prepend(el.cloneNode(true)); } catch { /* cross-origin */ }
    }
  });

  // ── 4. Measure the actual rendered content size ──────────
  // After the HTML is inserted the browser lays it out.
  // Read the real scroll dimensions to detect landscape sheets.
  const contentW = container.scrollWidth;
  const contentH = container.scrollHeight;

  // Auto-detect orientation: landscape when content is wider than tall
  // and wider than A4 portrait content area (~170mm = 644px at 96dpi).
  const autoOrientation: 'portrait' | 'landscape' =
    opts.orientation ||
    (contentW > 760 && contentW > contentH * 0.8 ? 'landscape' : 'portrait');

  // A4 dimensions in mm
  const pageWmm = autoOrientation === 'landscape' ? 297 : 210;
  const pageHmm = autoOrientation === 'landscape' ? 210 : 297;

  // Available content width in px at 96dpi (1mm = 3.7795px)
  const availableWidthPx = Math.round((pageWmm - marginMm * 2) * 3.7795);

  // Shrink-wrap the container to either available width or content width,
  // whichever is smaller, so wide sheets scale to fit.
  const renderWidth = Math.min(contentW, availableWidthPx);
  container.style.width = `${renderWidth}px`;

  const name = filename.replace(/\.[^.]+$/, '.pdf');

  const options = {
    margin: [marginMm, marginMm, marginMm, marginMm],
    filename: name,
    image: { type: 'jpeg', quality },
    html2canvas: {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: renderWidth,
      windowHeight: contentH,
    },
    jsPDF: {
      unit: 'mm',
      format: [pageWmm, pageHmm],
      orientation: autoOrientation,
    },
    pagebreak: {
      mode: ['css', 'legacy'],
      before: '.page-break',
      avoid: ['tr', 'td', 'th', 'img'],
    },
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

// ─────────────────────────────────────────────────────────────
// Render arbitrary HTML to a canvas (for embedding in DOCX etc.)
// Uses the standalone html2canvas package, NOT the bundled one.
// ─────────────────────────────────────────────────────────────
export async function renderHtmlToCanvas(
  html: string,
  opts: { scale?: number; maxWidthPx?: number } = {},
): Promise<HTMLCanvasElement> {
  const { scale = 2, maxWidthPx = 1200 } = opts;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2canvas = (await import('html2canvas')).default as any;

  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'left:-99999px',
    'top:0',
    `width:${maxWidthPx}px`,
    'background:#ffffff',
    'color:#000000',
    'font-family:Arial,Helvetica,sans-serif',
    'font-size:11px',
    'line-height:1.4',
    'padding:0',
    'box-sizing:border-box',
    'overflow:visible',
  ].join(';');
  container.innerHTML = html;
  document.body.appendChild(container);

  // Shrink-wrap to actual rendered content
  const actualW = Math.min(container.scrollWidth, maxWidthPx);
  container.style.width = `${actualW}px`;

  try {
    return await html2canvas(container, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: actualW,
    });
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
