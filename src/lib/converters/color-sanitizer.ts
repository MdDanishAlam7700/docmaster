'use client';

function resolveColor(cssValue: string): string {
  if (typeof window === 'undefined') return '#000000';
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

  try {
    return await action();
  } finally {
    // 4. Restore original document.styleSheets descriptor
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
