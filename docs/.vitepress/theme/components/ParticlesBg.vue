<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Ambient particles — faithful port of the HUMAN-VALIDATED algorithm in
// dir_3_v4.html (v3.2 validated, recolored to the accent token): 56 particles,
// slow upward drift + horizontal sinus, alpha pulsation, 25% glow, DPR-capped
// retina, repaint on theme toggle. Decorative only (aria-hidden, pointer-events
// none, disabled under prefers-reduced-motion). No network, no storage.
const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let ps: { x: number; y: number; r: number; s: number; p: number; a: number; glow: boolean }[] = []
let w = 0
let h = 0
let raf: number | null = null
let t = 0
let observer: MutationObserver | null = null
let running = false

function resize() {
  const el = canvas.value
  if (!el || !ctx) return
  const hero = el.parentElement
  const DPR = Math.min(2, window.devicePixelRatio || 1)
  w = el.width = Math.max(1, hero ? hero.clientWidth : 1) * DPR
  h = el.height = Math.max(1, hero ? hero.clientHeight : 1) * DPR
  if (!ps.length) {
    for (let i = 0; i < 56; i++) {
      ps.push({
        x: Math.random(),
        y: Math.random(),
        r: 1 + Math.random() * 1.6,
        s: 6 + Math.random() * 14,
        p: Math.random() * Math.PI * 2,
        a: 0.3 + Math.random() * 0.3,
        glow: Math.random() < 0.25,
      })
    }
  }
}

function paint() {
  if (!canvas.value || !ctx) return
  const color =
    getComputedStyle(document.documentElement).getPropertyValue('--vp-c-brand-1').trim() || '#00b386'
  const DPR = Math.min(2, window.devicePixelRatio || 1)
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  ctx.clearRect(0, 0, w / DPR, h / DPR)
  const H = h / DPR
  const W = w / DPR
  for (const p of ps) {
    const drift = t * p.s * 0.02
    let y = (p.y * H - drift) % (H + 24) - 12
    if (y < -12) y += H + 24
    const x = p.x * W + Math.sin(t * 0.0012 + p.p) * 14
    const tw = 0.75 + 0.25 * Math.sin(t * 0.002 + p.p)
    if (p.glow) {
      ctx.globalAlpha = Math.max(0.07, p.a * 0.4 * tw)
      ctx.beginPath()
      ctx.arc(x, y, p.r * 3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }
    ctx.globalAlpha = Math.max(0.12, p.a * tw)
    ctx.beginPath()
    ctx.arc(x, y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function frame() {
  paint()
  t++
  raf = requestAnimationFrame(frame)
}
function start() {
  if (raf || !running) return
  raf = requestAnimationFrame(frame)
}
function stop() {
  if (raf) cancelAnimationFrame(raf)
  raf = null
}

onMounted(() => {
  if (!canvas.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  ctx = canvas.value.getContext('2d')
  if (!ctx) return
  running = true
  resize()
  start()
  window.addEventListener('resize', resize)
  // Repaint when the VitePress theme toggle flips the .dark class (token color change).
  observer = new MutationObserver(() => {
    if (running) paint()
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  stop()
  running = false
  window.removeEventListener('resize', resize)
  observer?.disconnect()
})
</script>

<template>
  <canvas ref="canvas" class="particles-bg" aria-hidden="true"></canvas>
</template>

<style scoped>
.particles-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.7;
  z-index: 0;
}
@media (prefers-reduced-motion: reduce) {
  .particles-bg {
    display: none;
  }
}
</style>
