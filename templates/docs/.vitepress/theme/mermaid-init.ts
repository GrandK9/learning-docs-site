import mermaid from 'mermaid'
import { nextTick } from 'vue'

let initialized = false

function decodeMermaidSource(b64: string): string {
  const binary = atob(b64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function materializePlaceholders(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('.vp-mermaid[data-mermaid-b64]').forEach((el) => {
    const b64 = el.getAttribute('data-mermaid-b64')
    if (!b64) return
    const diagram = document.createElement('div')
    diagram.className = 'mermaid'
    diagram.textContent = decodeMermaidSource(b64)
    el.replaceWith(diagram)
  })
}

export async function renderMermaidInPage() {
  if (typeof document === 'undefined') return

  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default'
    })
    initialized = true
  }

  await nextTick()
  await nextTick()

  const content = document.querySelector('.vp-doc') ?? document
  materializePlaceholders(content)

  const nodes = content.querySelectorAll<HTMLElement>('.mermaid')
  if (!nodes.length) return

  try {
    await mermaid.run({ nodes })
  } catch (err) {
    console.error('[mermaid]', err)
  }
}
