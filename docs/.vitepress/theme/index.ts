import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import StatusPill from './components/StatusPill.vue'
import NavCta from './components/NavCta.vue'
import HeroSection from './components/HeroSection.vue'
import ConformanceLadder from './components/ConformanceLadder.vue'
import FooterV4 from './components/FooterV4.vue'
import './custom.css'

// Signal v4 theme: DefaultTheme + tokens (custom.css), the validated status pill
// injected into the nav bar (nav-bar-content-before slot), and the home components
// registered globally so they can be used from markdown (V-001).
export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(StatusPill),
      'nav-bar-content-after': () => h(NavCta),
      'layout-bottom': () => h(FooterV4),
    }),
  enhanceApp({ app }) {
    app.component('HeroSection', HeroSection)
    app.component('ConformanceLadder', ConformanceLadder)
  },
} satisfies Theme
