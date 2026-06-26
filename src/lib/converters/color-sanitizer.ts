'use client';

let originalGetComputedStyle: typeof window.getComputedStyle | null = null;

// Convert modern CSS colors (oklch, lab, etc.) to standard rgba using an off-screen canvas.
// This preserves the exact visual colors instead of forcing them to black.
export function resolveColorToRgba(cssValue: string): string {
  if (typeof window === 'undefined') return '#000000';
  try {
    const el = document.createElement('div');
    el.style.display = 'none';
    el.style.color = cssValue;
    document.body.appendChild(el);
    
    // Retrieve computed style using original getComputedStyle to bypass the proxy recursion
    const getStyle = originalGetComputedStyle || window.getComputedStyle;
    let resolved = getStyle.call(window, el).color;
    document.body.removeChild(el);

    if (!resolved) return '#000000';

    // If browser supports and returns a modern color space, rasterize it to rgba via Canvas 2D
    if (/\b(oklch|oklab|lab|lch|color)\s*\(/i.test(resolved)) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = resolved;
        ctx.fillRect(0, 0, 1, 1);
        const imgData = ctx.getImageData(0, 0, 1, 1).data;
        const [r, g, b, a] = imgData;
        return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
      }
    }
    return resolved;
  } catch {
    return '#000000';
  }
}

export function sanitizeCSSText(css: string): string {
  if (!css) return css;
  return css.replace(
    /\b(oklch|oklab|lab|lch|color)\s*\([^)]+\)/gi,
    (match) => resolveColorToRgba(match)
  );
}

/**
 * Sanitize modern color functions inside a full HTML document string.
 * This covers both <style> blocks and inline style attributes.
 */
export function sanitizeHtmlColors(html: string): string {
  if (!html) return html;
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

export async function runWithSanitizedStyleSheets<T>(
  container: HTMLElement,
  action: () => Promise<T>
): Promise<T> {
  if (typeof window === 'undefined') {
    return action();
  }

  // 1. Hook window.getComputedStyle to intercept and resolve modern colors on computed styles
  const originalGetComputedStyleLocal = window.getComputedStyle;
  originalGetComputedStyle = originalGetComputedStyleLocal;

  window.getComputedStyle = function(elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    const styles = originalGetComputedStyleLocal.call(window, elt, pseudoElt);
    return new Proxy(styles, {
      get(target, prop) {
        const val = Reflect.get(target, prop); // No receiver argument to prevent Illegal invocation
        if (typeof val === 'function') {
          if (prop === 'getPropertyValue') {
            return function(propertyName: string) {
              const originalVal = target.getPropertyValue(propertyName);
              return sanitizeCSSText(originalVal);
            };
          }
          return val.bind(target);
        }
        if (typeof prop === 'string' && isNaN(Number(prop))) {
          return sanitizeCSSText(val);
        }
        return val;
      }
    }) as unknown as CSSStyleDeclaration;
  };

  try {
    return await action();
  } finally {
    // 2. Restore original window.getComputedStyle
    if (originalGetComputedStyleLocal) {
      window.getComputedStyle = originalGetComputedStyleLocal;
    }
    originalGetComputedStyle = null;
  }
}
