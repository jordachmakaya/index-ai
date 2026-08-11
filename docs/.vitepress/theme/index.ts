import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import StatusPill from './components/StatusPill.vue'
import NavBrandMark from './components/NavBrandMark.vue'
import ThemeToggleV4 from './components/ThemeToggleV4.vue'
import NavCta from './components/NavCta.vue'
import HeroSection from './components/HeroSection.vue'
import ConformanceLadder from './components/ConformanceLadder.vue'
import FooterV4 from './components/FooterV4.vue'
import './custom.css'

// Signal v4 theme: DefaultTheme + tokens (custom.css), the validated status pill
// injected into the nav bar (nav-bar-content-before slot), and the home components
// registered globally so they can be used from markdown (V-001).
// Nav = validated v4 layout: brand mark before the title, [pill | toggle | CTA]
// on the right (native VPSwitchAppearance hidden via custom.css).
export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-title-before': () => h(NavBrandMark),
      'nav-bar-content-before': () => h(StatusPill),
      'nav-bar-content-after': () => h('div', { class: 'nav-actions' }, [h(ThemeToggleV4), h(NavCta)]),
      'layout-bottom': () => h(FooterV4),
    }),
  enhanceApp({ app }) {
    app.component('HeroSection', HeroSection)
    app.component('ConformanceLadder', ConformanceLadder)
  },
} satisfies Theme
