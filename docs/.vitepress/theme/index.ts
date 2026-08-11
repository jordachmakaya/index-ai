import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import NavBrandMark from './components/NavBrandMark.vue'
import ThemeToggleV4 from './components/ThemeToggleV4.vue'
import NavCta from './components/NavCta.vue'
import HeroSection from './components/HeroSection.vue'
import ConformanceLadder from './components/ConformanceLadder.vue'
import FooterV4 from './components/FooterV4.vue'
import './custom.css'

// Signal v4 theme: DefaultTheme + tokens (custom.css) and the home components
// registered globally so they can be used from markdown (V-001).
// Nav = validated v4 layout: brand mark before the title, [toggle | CTA] on the
// right (native VPSwitchAppearance hidden via custom.css). Client decision
// 2026-08-12: the "1.0-rc1 · RFC" status pill was removed from the nav.
export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-title-before': () => h(NavBrandMark),
      'nav-bar-content-after': () => h('div', { class: 'nav-actions' }, [h(ThemeToggleV4), h(NavCta)]),
      'layout-bottom': () => h(FooterV4),
    }),
  enhanceApp({ app }) {
    app.component('HeroSection', HeroSection)
    app.component('ConformanceLadder', ConformanceLadder)
  },
} satisfies Theme
