import { createHighlighter, type Highlighter } from 'shiki'
import { setCodeBlockHighlighter } from '@pulse/blocks'

let shikiPromise: Promise<Highlighter> | null = null
let shikiReady = false

export async function initShikiHighlighter(): Promise<void> {
  if (shikiReady) return
  if (shikiPromise) {
    await shikiPromise
    return
  }

  shikiPromise = createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [
      'typescript', 'tsx', 'javascript', 'jsx', 'json',
      'html', 'css', 'markdown', 'bash', 'http',
      'python', 'go', 'rust',
    ],
  })

  try {
    const highlighter = await shikiPromise
    setCodeBlockHighlighter({
      codeToHtml(code, options) {
        return highlighter.codeToHtml(code, {
          lang: options.lang,
          theme: options.theme,
        })
      },
    })
    shikiReady = true
  } catch (err) {
    console.warn('Shiki highlighter initialization failed:', err)
    shikiPromise = null
  }
}

export function isShikiReady(): boolean {
  return shikiReady
}
