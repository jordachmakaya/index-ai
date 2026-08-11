import { defineConfig } from 'vitepress'

// index-ai — static docs site under the validated Signal v4 direction.
// base: '/index-ai/' is deliberately NOT set here — it lands with the Pages deploy (T3.1).
export default defineConfig({
  lang: 'en-US',
  title: 'index-ai',
  description: 'Make your content verifiably readable by AI agents — open specification, validator guidance, docs.',
  cleanUrls: true,
  appearance: true, // light/dark toggle (VitePress built-in, themed via custom.css tokens)
  lastUpdated: false,
  themeConfig: {
    nav: [
      { text: 'Spec', link: '/spec/' },
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'vs llms.txt', link: '/compare/llms-txt' },
      { text: 'Changelog', link: '/changelog' },
    ],
    footer: {
      message: 'Spec text CC-BY-4.0 · Code MIT',
      copyright: 'index-ai 1.0-rc1 — Request for Comments',
    },
  },
})
