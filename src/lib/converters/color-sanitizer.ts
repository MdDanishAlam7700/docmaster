'use client';

let originalGetComputedStyle: typeof window.getComputedStyle | null = null;

function resolveColor(cssValue: string): string {
  if (typeof window === 'undefined') return '#000000';
  try {
    const el = document.createElement('div');
    el.style.display = 'none';
    el.style.color = cssValue;
    document.body.appendChild(el);
    
    // Retrieve computed style using the original getComputedStyle to avoid proxy recursion
    const getStyle = originalGetComputedStyle || window.getComputedStyle;
    let resolved = getStyle.call(window, el).color;
    document.body.removeChild(el);

    if (!resolved) return '#000000';

    // If the resolved color contains oklch/oklab/lab/lch/color functions,
    // render it on a 1x1 canvas to convert it to standard rgba pixels.
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

function sanitizeCSSValue(val: any): any {
  if (typeof val !== 'string') return val;
  if (/\b(oklch|oklab|lab|lch|color)\s*\(/i.test(val)) {
    return val.replace(
      /\b(oklch|oklab|lab|lch|color)\s*\([^)]+\)/gi,
      (match) => resolveColor(match)
    );
  }
  return val;
}

export function getSafeStyleBlock(styleText: string): string {
  return styleText.replace(
    /\b(oklch|oklab|lab|lch|color)\s*\([^)]+\)/gi,
    (match) => resolveColor(match),
  );
}

async function getCSSForStyleSheet(sheet: CSSStyleSheet, node: Element): Promise<string> {
  // 1. Try to read rules directly (same-origin)
  try {
    if (sheet.cssRules) {
      return Array.from(sheet.cssRules)
        .map(rule => rule.cssText)
        .join('\n');
    }
  } catch {
    // Cross-origin CSS rules access is blocked
  }

  // 2. If it's a link node, try to fetch it
  if (node.tagName.toLowerCase() === 'link') {
    const href = (node as HTMLLinkElement).href;
    if (href) {
      try {
        const res = await fetch(href);
        if (res.ok) {
          return await res.text();
        }
      } catch {}
    }
  }

  // 3. Fallback to textContent for style tags
  return node.textContent || '';
}

export async function runWithSanitizedStyleSheets<T>(
  container: HTMLElement,
  action: () => Promise<T>
): Promise<T> {
  if (typeof window === 'undefined') {
    return action();
  }

  // 1. Collect all stylesheets currently active on the page
  const sheetsToProcess: { sheet: CSSStyleSheet; node: Element }[] = [];
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    if (sheet.ownerNode && sheet.ownerNode instanceof Element) {
      sheetsToProcess.push({ sheet, node: sheet.ownerNode });
    }
  }

  // 2. Extract, sanitize and prepend safe CSS style blocks to the container
  for (const item of sheetsToProcess) {
    const rawCSS = await getCSSForStyleSheet(item.sheet, item.node);
    if (rawCSS) {
      const safeCSS = getSafeStyleBlock(rawCSS);
      const styleEl = document.createElement('style');
      styleEl.textContent = safeCSS;
      container.prepend(styleEl);
    }
  }

  // 3. Mock document.styleSheets to only return our sanitized style elements
  const sanitizedSheets = Array.from(container.querySelectorAll('style'))
    .map(el => (el as HTMLStyleElement).sheet)
    .filter(Boolean) as CSSStyleSheet[];

  const mockStyleSheets = {
    length: sanitizedSheets.length,
    item: (index: number) => sanitizedSheets[index],
  } as any;
  
  sanitizedSheets.forEach((sheet, idx) => {
    mockStyleSheets[idx] = sheet;
  });
  
  const mockStyleSheetsList = mockStyleSheets as unknown as StyleSheetList;

  const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'styleSheets');
  
  try {
    Object.defineProperty(document, 'styleSheets', {
      get: () => mockStyleSheetsList,
      configurable: true,
    });
  } catch (e) {
    console.warn('[DocMaster] Failed to redefine document.styleSheets', e);
  }

  // 4. Hook window.getComputedStyle to intercept and resolve modern colors on computed styles
  const originalGetComputedStyleLocal = window.getComputedStyle;
  originalGetComputedStyle = originalGetComputedStyleLocal;

  window.getComputedStyle = function(elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    const styles = originalGetComputedStyleLocal.call(window, elt, pseudoElt);
    return new Proxy(styles, {
      get(target, prop, receiver) {
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'function') {
          if (prop === 'getPropertyValue') {
            return function(propertyName: string) {
              const originalVal = target.getPropertyValue(propertyName);
              return sanitizeCSSValue(originalVal);
            };
          }
          return val.bind(target);
        }
        if (typeof prop === 'string' && isNaN(Number(prop))) {
          return sanitizeCSSValue(val);
        }
        return val;
      }
    }) as unknown as CSSStyleDeclaration;
  };

  try {
    return await action();
  } finally {
    // 5. Restore original window.getComputedStyle
    if (originalGetComputedStyleLocal) {
      window.getComputedStyle = originalGetComputedStyleLocal;
    }
    originalGetComputedStyle = null;

    // 6. Restore original document.styleSheets descriptor
    try {
      if (originalDescriptor) {
        Object.defineProperty(document, 'styleSheets', originalDescriptor);
      } else {
        delete (document as any).styleSheets;
      }
    } catch (e) {
      console.error('[DocMaster] Failed to restore document.styleSheets', e);
    }
  }
}
