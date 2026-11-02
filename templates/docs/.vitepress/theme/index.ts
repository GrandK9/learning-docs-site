import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { onMounted, watch } from 'vue'
import { onContentUpdated, useData } from 'vitepress'
import CardGrid from './CardGrid.vue'
import Card from './Card.vue'
import { renderMermaidInPage } from './mermaid-init'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CardGrid', CardGrid)
    app.component('Card', Card)
  },
  setup() {
    const { isDark } = useData()

    onMounted(() => {
      void renderMermaidInPage()
    })

    onContentUpdated(() => {
      void renderMermaidInPage()
    })

    // 深/浅色切换不会触发 onContentUpdated，必须单独监听并强制重渲染
    watch(
      isDark,
      () => {
        void renderMermaidInPage({ force: true })
      },
      { flush: 'post' }
    )
  }
} satisfies Theme
