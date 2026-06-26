'use client';

/**
 * Replaces modern CSS color functions (oklch, oklab, lab, lch, color())
 * with #000000 fallback. These are not supported by html2canvas and will
 * crash the rendering pipeline if left in computed styles.
 *
 * This operates on CSS TEXT ONLY — no DOM mocking, no styleSheets
 * replacement, no getComputedStyle proxies. html2canvas is free to
 * read document.styleSheets and getComputedStyle natively without
 * interference.
 */

const MODERN_COLOR_RE = /\b(oklch|oklab|lab|lch|color)\s*\([^)]+\)/gi;

export function sanitizeCSSText(css: string): string {
  return css.replace(MODERN_COLOR_RE, '#000000');
}

/**
 * Sanitize modern color functions inside a full HTML document string.
 * This covers both <style> blocks and inline style attributes.
 */
export function sanitizeHtmlColors(html: string): string {
  return html
    // Sanitize <style>...</style> blocks
    .replace(
      /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
      (match, cssContent: string) =>
        match.replace(cssContent, sanitizeCSSText(cssContent)),
    )
    // Sanitize inline style="..." attributes
    .replace(
      /style\s*=\s*"([^"]*)"/gi,
      (match, styleVal: string) =>
        `style="${sanitizeCSSText(styleVal)}"`,
    )
    .replace(
      /style\s*=\s*'([^']*)'/gi,
      (match, styleVal: string) =>
        `style='${sanitizeCSSText(styleVal)}'`,
    );
}
