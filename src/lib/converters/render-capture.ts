/**
 * render-capture.ts
 *
 * Mounts a React element into an off-screen DOM node using
 * ReactDOM.createRoot, forces a synchronous layout flush, then captures
 * the rendered output with html2canvas at 2× resolution.
 *
 * This is the "glue" layer: React's layout engine calculates column widths,
 * colspan/rowspan expansion, border-collapse, text wrapping, etc.  html2canvas
 * then produces a pixel-perfect raster that can be embedded in PDFs or DOCX files.
 */

'use client';

import type { ReactElement } from 'react';


export interface CaptureOptions {
  /** html2canvas devicePixelRatio override.  Default: 2 (sharp on HiDPI). */
  scale?: number;
  /** Maximum container width before the content is allowed to scroll. Default: 1600. */
  maxWidthPx?: number;
  /** Background fill colour behind the rendered component.  Default: '#ffffff'. */
  bgColor?: string;
}

export interface CaptureResult {
  canvas: HTMLCanvasElement;
  /** Actual rendered content width (CSS pixels, i.e. canvas.width / scale). */
  widthPx: number;
  /** Actual rendered content height (CSS pixels). */
  heightPx: number;
}

/**
 * Renders `jsx` off-screen and returns the captured canvas.
 *
 * Must be called from a browser context (event handler / async function).
 * Do NOT call inside a React render cycle — it uses flushSync internally.
 */
export async function captureComponent(
  jsx: ReactElement,
  opts: CaptureOptions = {},
): Promise<CaptureResult> {
  const { scale = 2, maxWidthPx = 1600, bgColor = '#ffffff' } = opts;

  // Lazy-load everything so this module is safe to import server-side
  const [{ createRoot }, { flushSync }, html2canvasDefault] = await Promise.all([
    import('react-dom/client'),
    import('react-dom'),
    import('html2canvas').then((m) => m.default),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2canvas = html2canvasDefault as any;

  // ── Off-screen container ────────────────────────────────────────────────────
  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'left:-99999px',
    'top:0',
    // Use inline-block so the container shrinks to content width
    'display:inline-block',
    `max-width:${maxWidthPx}px`,
    `background:${bgColor}`,
    'overflow:visible',
    // Prevent the app's body font-size from leaking in
    'font-size:14px',
    'line-height:1.4',
  ].join(';');
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    // flushSync forces React to complete the render synchronously before
    // returning.  This is safe here because we created a *new* root that
    // is not part of any existing React tree.
    flushSync(() => root.render(jsx));

    // After the flush, the browser has laid out the component.
    const widthPx = Math.min(container.scrollWidth, maxWidthPx);
    const heightPx = container.scrollHeight;

    const canvas: HTMLCanvasElement = await html2canvas(container, {
      scale,
      backgroundColor: bgColor,
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: widthPx,
      windowHeight: heightPx,
    });

    return { canvas, widthPx, heightPx };
  } finally {
    root.unmount();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

// ── Helpers: canvas → Blob/Uint8Array ─────────────────────────────────────────

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas.toBlob() returned null'))),
      type,
      quality,
    );
  });
}

export async function canvasToUint8Array(
  canvas: HTMLCanvasElement,
  type: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): Promise<Uint8Array> {
  const blob = await canvasToBlob(canvas, type, quality);
  return new Uint8Array(await blob.arrayBuffer());
}
