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
    // footer is deliberately NOT set: the validated v4 foot-line (meta row +
    // the four nav links + centered Shokunin badge) renders via FooterV4 in the
    // layout-bottom slot — the native VitePress VPFooter would drift from it.
  },
})
