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
    // og:url is set per page by transformHead below (every page previously
    // shared the homepage URL — audit round 4).
    ['meta', { property: 'og:image', content: 'https://jordachmakaya.github.io/index-ai/images/index-ai-og.jpg' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: 'index-ai — one site, two interfaces: the human page and the agent view' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'index-ai — An open specification proposal for agent-readable web content' }],
    ['meta', { name: 'twitter:description', content: 'Make your content verifiably readable by AI agents — open specification, validator guidance, docs.' }],
    ['meta', { name: 'twitter:image', content: 'https://jordachmakaya.github.io/index-ai/images/index-ai-og.jpg' }],
    // index-ai eats its own dog food: the sub-path discovery mechanism (§5.3)
    // that makes a GitHub Pages deployment Level 1-discoverable.
    ['link', { rel: 'agent-manifest', href: '/index-ai/.well-known/index-ai.json', type: 'application/json' }],
  ],
  // The code surface is a dark terminal in BOTH themes (--vp-c-term-bg in
  // custom.css), so shiki's default dual theme (github-light/github-dark)
  // renders light-mode ink tokens unreadable in light mode. Force the dark
  // token palette on both sides of the appearance switch.
  markdown: {
    theme: { light: 'github-dark', dark: 'github-dark' },
  },
  // Per-page canonical + og:url (audit round 4): every page previously shared
  // the homepage's og:url and had no canonical. cleanUrls: true strips .md.
  transformHead({ pageData }) {
    const rel = pageData.relativePath ?? ''
    const base = 'https://jordachmakaya.github.io/index-ai'
    let path: string
    if (rel === '' || rel === 'index.md') path = ''
    else if (rel.endsWith('index.md')) path = `/${rel.slice(0, -'index.md'.length)}`
    else path = `/${rel.replace(/\.md$/, '')}`
    const url = `${base}${path}`
    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:url', content: url }],
    ]
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
