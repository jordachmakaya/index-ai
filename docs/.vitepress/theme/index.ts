import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import StatusPill from './components/StatusPill.vue'
import SpecToc from './components/SpecToc.vue'
import HeroSection from './components/HeroSection.vue'
import ConformanceLadder from './components/ConformanceLadder.vue'
import FooterBadge from './components/FooterBadge.vue'
import './custom.css'

// Signal v4 theme: DefaultTheme + tokens (custom.css), the validated status pill
// injected into the nav bar (nav-bar-content-before slot), and the home components
// registered globally so they can be used from markdown (V-001).
export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(StatusPill),
      'layout-bottom': () => h(FooterBadge),
    }),
  enhanceApp({ app }) {
    app.component('HeroSection', HeroSection)
    app.component('ConformanceLadder', ConformanceLadder)
    app.component('SpecToc', SpecToc)
  },
} satisfies Theme
