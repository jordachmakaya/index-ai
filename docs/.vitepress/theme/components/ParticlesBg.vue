<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { tsParticles } from '@tsparticles/engine'
import { loadFull } from 'tsparticles'

// Q4: tsparticles (~9 KB gzip equivalent via loadFull) — hero particle background.
// Disabled under prefers-reduced-motion; color read from the token at mount so it
// follows the active theme. No network, no storage, purely decorative (aria-hidden).
const el = ref<HTMLElement | null>(null)
let active = false

onMounted(async () => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || !el.value) return
  await loadFull(tsParticles)
  const accent =
    getComputedStyle(document.documentElement).getPropertyValue('--vp-c-brand-1').trim() || '#00b386'
  await tsParticles.load({
    id: 'hero-particles',
    element: el.value,
    options: {
      fullScreen: { enable: false },
      fpsLimit: 60,
      detectRetina: true,
      background: { color: 'transparent' },
      particles: {
        number: { value: 42, density: { enable: true, width: 960, height: 480 } },
        color: { value: accent },
        shape: { type: 'circle' },
        opacity: { value: 0.22 },
        size: { value: { min: 1, max: 2.5 } },
        move: { enable: true, speed: 0.35, direction: 'none', outModes: { default: 'out' } },
        links: { enable: false },
      },
      interactivity: { events: { onHover: { enable: false }, onClick: { enable: false } }, modes: {} },
    },
  })
  active = true
})

onBeforeUnmount(() => {
  if (active) {
    tsParticles.dom().forEach((p) => p.destroy())
    active = false
  }
})
</script>

<template>
  <div ref="el" class="particles-bg" aria-hidden="true"></div>
</template>

<style scoped>
.particles-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
</style>
