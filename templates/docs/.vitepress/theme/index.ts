import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { onMounted } from 'vue'
import { onContentUpdated } from 'vitepress'
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
    onMounted(() => {
      void renderMermaidInPage()
    })

    onContentUpdated(() => {
      void renderMermaidInPage()
    })
  }
} satisfies Theme
