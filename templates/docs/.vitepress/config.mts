// 占位符：{{站点名}}、{{站点描述}}、{{主题组1}}、{{主题组1slug}}、{{章名}}
// 替换完必须能通过 `npm run docs:build`，否则 sidebar 链接会 404。
import { Buffer } from 'node:buffer'
import { defineConfig } from 'vitepress'
import type MarkdownIt from 'markdown-it'

export default defineConfig({
  lang: 'zh-CN',
  title: '{{站点名}}',
  description: '{{站点描述}}',

  cleanUrls: true,
  lastUpdated: false,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '{{主题组1}}', link: '/{{主题组1slug}}/' }
    ],

    sidebar: [
      {
        text: '开始',
        collapsed: false,
        items: [
          { text: '概述', link: '/{{主题组1slug}}/' },
          { text: '怎么学', link: '/{{主题组1slug}}/how-to-learn' },
          { text: '总览地图', link: '/{{主题组1slug}}/00-map' }
        ]
      },
      {
        text: '正文章节',
        collapsed: false,
        items: [
          // { text: '01 {{章名}}', link: '/{{主题组1slug}}/01-<slug>' }
        ]
      },
      {
        text: '附录',
        collapsed: false,
        items: [{ text: '项目对照', link: '/{{主题组1slug}}/refs/项目对照' }]
      }
    ],

    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一章', next: '下一章' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清除',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    },

    footer: { message: '基于 VitePress 构建 · 本地阅读', copyright: '个人学习笔记' }
  },

  markdown: {
    lineNumbers: true,
    theme: { light: 'github-light', dark: 'github-dark' },
    config(md: MarkdownIt) {
      const defaultFence = md.renderer.rules.fence!
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        if (token.info.trim() === 'mermaid') {
          const src = token.content.trimEnd()
          const b64 = Buffer.from(src, 'utf8').toString('base64')
          return `<div class="vp-mermaid" data-mermaid-b64="${b64}"></div>\n`
        }
        return defaultFence(tokens, idx, options, env, self)
      }
    }
  },

  vite: {
    optimizeDeps: {
      include: ['mermaid']
    },
    ssr: {
      noExternal: ['mermaid']
    }
  }
})
