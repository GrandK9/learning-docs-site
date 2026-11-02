import mermaid from 'mermaid'
import { nextTick } from 'vue'

/** 渲染用源码存在这个属性上，主题变化时可据此还原重新渲染 */
const SOURCE_ATTR = 'data-mermaid-src'

let initialized = false
let currentTheme: 'dark' | 'default' | null = null
/** 串行化渲染，避免主题切换与路由切换同时触发导致重复渲染 */
let renderQueue: Promise<void> = Promise.resolve()

function decodeMermaidSource(b64: string): string {
  const binary = atob(b64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

/**
 * mermaid 的主题在 initialize 时被固定，之后切换明暗不会自动跟着变，
 * 必须重新 initialize 并重渲染，否则深色页面上仍是浅色主题的深色文字。
 */
function ensureTheme(): void {
  const theme = isDarkMode() ? 'dark' : 'default'
  if (initialized && currentTheme === theme) return

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme
  })
  initialized = true
  currentTheme = theme
}

function materializePlaceholders(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('.vp-mermaid[data-mermaid-b64]').forEach((el) => {
    const b64 = el.getAttribute('data-mermaid-b64')
    if (!b64) return
    const source = decodeMermaidSource(b64)
    const diagram = document.createElement('div')
    diagram.className = 'mermaid'
    diagram.setAttribute(SOURCE_ATTR, source)
    diagram.textContent = source
    el.replaceWith(diagram)
  })
}

/** 把已渲染的 svg 还原成源码，供主题切换后重新渲染 */
function restoreSource(el: HTMLElement): boolean {
  const source = el.getAttribute(SOURCE_ATTR)
  if (!source || !el.querySelector('svg')) return false
  el.removeAttribute('data-processed')
  el.textContent = source
  return true
}

export function renderMermaidInPage(options: { force?: boolean } = {}): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()

  renderQueue = renderQueue.then(() => renderSection(options)).catch((err) => {
    console.error('[mermaid]', err)
  })
  return renderQueue
}

async function renderSection(options: { force?: boolean }): Promise<void> {
  // 等两帧，确保主题 class 与路由内容都已落到 DOM 上
  await nextTick()
  await nextTick()

  ensureTheme()

  const content = document.querySelector('.vp-doc') ?? document
  materializePlaceholders(content)

  const nodes = Array.from(content.querySelectorAll<HTMLElement>('.mermaid'))
  if (!nodes.length) return

  if (options.force) nodes.forEach(restoreSource)

  const pending = nodes.filter((n) => !n.hasAttribute('data-processed') && n.textContent?.trim())
  if (!pending.length) return

  await mermaid.run({ nodes: pending })
}
