import { buildSandboxSrcdoc, buildPyodideSrcdoc, base64ToUtf8 } from '@pulse/blocks';

function isDemoIframe(el: Element | null): el is HTMLIFrameElement {
  return !!el && el.tagName === 'IFRAME' && el.getAttribute('title') === 'Code demo';
}

/**
 * Demo-mode code blocks auto-run on page load (Josh Comeau style): the rendered
 * HTML ships an <iframe title="Code demo"> with a live srcdoc. When the srcdoc
 * was stripped (e.g. React hydration of dangerouslySetInnerHTML on legacy
 * content) rebuild it from the base64 payload, and when the iframe is missing
 * entirely (content rendered before it was emitted inline) create it. Each
 * iframe is only ever initialized once, so demo blocks auto-run exactly once.
 */
export function hydrateDemoIframes(container: Element): void {
  container.querySelectorAll('iframe[title="Code demo"]').forEach((iframe) => {
    const el = iframe as HTMLIFrameElement;
    if (el.srcdoc) return;
    const codeB64 = el.getAttribute('data-code');
    const language = el.getAttribute('data-language');
    if (codeB64 && language) {
      try {
        el.srcdoc = buildSandboxSrcdoc(base64ToUtf8(codeB64), language);
      } catch (err) {
        console.error('[Pulse] Failed to hydrate demo iframe:', err);
      }
    }
  });

  // Fallback: create missing demo iframes for blocks that don't have one.
  container.querySelectorAll('.pulse-code-block[data-mode="demo"]').forEach((block) => {
    let sibling = block.nextElementSibling;
    // A demo caption sits between the block and its iframe when chrome is visible.
    if (sibling?.classList.contains('pulse-code-demo-caption')) {
      sibling = sibling.nextElementSibling;
    }
    if (isDemoIframe(sibling)) return;
    const codeB64 = block.getAttribute('data-code');
    const language = block.getAttribute('data-language');
    if (!codeB64 || !language) return;
    try {
      const iframe = document.createElement('iframe');
      iframe.sandbox = 'allow-scripts';
      iframe.title = 'Code demo';
      iframe.srcdoc = buildSandboxSrcdoc(base64ToUtf8(codeB64), language);
      iframe.style.cssText = 'width:100%;min-height:200px;border:none;display:block;background:transparent;';
      iframe.setAttribute('data-language', language);
      iframe.setAttribute('data-code', codeB64);
      block.parentNode?.insertBefore(iframe, sibling);
    } catch (err) {
      console.error('[Pulse] Failed to create demo iframe fallback:', err);
    }
  });
}

/**
 * Click delegation for code / code-sandbox blocks: Code/Output tab switching
 * and the Run button. Run rebuilds the sandbox srcdoc on demand — run-mode
 * iframes ship with a base64 data-code payload instead of a live srcdoc, so
 * nothing executes before the reader asks for it. Sandbox blocks run whatever
 * is currently in their editor (Pyodide for python).
 *
 * Returns true when the click was handled by a code block.
 */
export function handleCodeBlockClick(e: Event): boolean {
  const target = e.target as HTMLElement;

  const tab = target.closest('.pulse-code-tab');
  if (tab) {
    const block = tab.closest('.pulse-code-block');
    if (!block) return false;
    const tabName = tab.getAttribute('data-tab');
    block.setAttribute('data-active-tab', tabName || '');
    block.querySelectorAll('.pulse-code-tab').forEach((t) => {
      t.classList.toggle('active', t === tab);
    });
    return true;
  }

  const runBtn = target.closest('[data-run]');
  if (runBtn) {
    const block = runBtn.closest('.pulse-code-block');
    if (!block) return false;
    const iframe = block.querySelector('.pulse-code-panel[data-panel="output"] iframe') as HTMLIFrameElement | null;
    if (iframe) {
      const mode = block.getAttribute('data-mode');
      const language = block.getAttribute('data-language') || iframe.getAttribute('data-language') || 'javascript';
      try {
        if (mode === 'sandbox') {
          const editor = block.querySelector('[data-sandbox-editor]') as HTMLTextAreaElement | null;
          const code = editor?.value ?? '';
          iframe.srcdoc = language === 'python' ? buildPyodideSrcdoc(code) : buildSandboxSrcdoc(code, language);
        } else {
          const codeB64 = iframe.getAttribute('data-code');
          if (codeB64) {
            iframe.srcdoc = buildSandboxSrcdoc(base64ToUtf8(codeB64), language);
          }
        }
      } catch (err) {
        console.error('[Pulse] Failed to run code block:', err);
      }
    }
    block.setAttribute('data-active-tab', 'output');
    block.querySelectorAll('.pulse-code-tab').forEach((t) => {
      t.classList.toggle('active', t.getAttribute('data-tab') === 'output');
    });
    return true;
  }

  return false;
}
