import { defineConfig } from 'vitepress'

// index-ai — static docs site under the validated Signal v4 direction.
// base matches the project Pages URL (T3.1): username.github.io/index-ai/.
export default defineConfig({
  base: '/index-ai/',
  lang: 'en-US',
  title: 'index-ai',
  description: 'Make your content verifiably readable by AI agents — open specification, validator guidance, docs.',
  cleanUrls: true,
  appearance: true, // light/dark toggle (VitePress built-in, themed via custom.css tokens)
  lastUpdated: false,
  // Social sharing (X/LinkedIn): public absolute URLs — the live site is
  // served under username.github.io/index-ai/. OG image is a 1200x630 crop of
  // the visual metaphor (docs/public/images/index-ai-og.jpg).
  head: [
    ['meta', { property: 'og:title', content: 'index-ai — An open specification proposal for agent-readable web content' }],
    ['meta', { property: 'og:description', content: 'Make your content verifiably readable by AI agents — open specification, validator guidance, docs.' }],
    ['meta', { property: 'og:url', content: 'https://jordachmakaya.github.io/index-ai/' }],
    ['meta', { property: 'og:image', content: 'https://jordachmakaya.github.io/index-ai/images/index-ai-og.jpg' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: 'index-ai — one site, two interfaces: the human page and the agent view' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'index-ai — An open specification proposal for agent-readable web content' }],
    ['meta', { name: 'twitter:description', content: 'Make your content verifiably readable by AI agents — open specification, validator guidance, docs.' }],
    ['meta', { name: 'twitter:image', content: 'https://jordachmakaya.github.io/index-ai/images/index-ai-og.jpg' }],
  ],
  // The code surface is a dark terminal in BOTH themes (--vp-c-term-bg in
  // custom.css), so shiki's default dual theme (github-light/github-dark)
  // renders light-mode ink tokens unreadable in light mode. Force the dark
  // token palette on both sides of the appearance switch.
  markdown: {
    theme: { light: 'github-dark', dark: 'github-dark' },
  },
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
