<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import ParticlesBg from './ParticlesBg.vue'

// v4 Hero (H7, validated dir_3_v4.html): display headline LEFT, real video RIGHT
// (grid minmax(0,1fr) minmax(0,1.25fr)), video with native controls + a
// "click to play with sound" overlay (autoplay stays muted per browser policy;
// a user click explicitly UNMUTES and plays). withBase keeps the asset working
// once base '/index-ai/' lands with the Pages deploy (T3.1).
const videoSrc = withBase('/index-ai-intro.mp4')
const showOverlay = ref(true)
const videoEl = ref<HTMLVideoElement | null>(null)

function onLoadedMeta() {
  // Video is playable — drop the placeholder; keep autoplay muted (policy).
  showOverlay.value = false
  if (videoEl.value?.paused) videoEl.value.play().catch(() => {})
}

function playWithSound() {
  // Explicit user gesture → allowed to unmute: humans need the audio.
  showOverlay.value = false
  if (videoEl.value) {
    videoEl.value.muted = false
    videoEl.value.play().catch(() => {})
  }
}

// Reveal stagger (validated v4): the hidden state is gated behind a `js` class
// added here — SSR/no-JS output stays visible, and reduced-motion never hides
// content (the global reduce block forces opacity:1). Delays are set BEFORE the
// class flip so the entrance animation starts staggered.
onMounted(() => {
  document.querySelectorAll<HTMLElement>('.reveal').forEach((el, i) => {
    el.style.setProperty('--reveal-delay', `${i * 60}ms`)
  })
  document.documentElement.classList.add('js')
})
onBeforeUnmount(() => {
  document.documentElement.classList.remove('js')
  document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
    el.style.removeProperty('--reveal-delay')
  })
})
</script>

<template>
  <section class="hero" id="top">
    <ParticlesBg />
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <span class="hero-tag reveal">A public standard for the machine web</span>
        <h1 class="hero-title reveal">
          Make your content <span class="hl">verifiably readable</span> by AI agents.
        </h1>
        <p class="hero-lede reveal">
          index-ai is an open specification that lets websites expose a structured layer for agents —
          who you are, what content exists, how big it is — measured and verified, not declared.
        </p>
        <div class="hero-cta reveal">
          <a class="btn btn-primary" href="/spec/">Read the specification</a>
          <a class="btn btn-soft" href="/quickstart">Follow the quickstart</a>
        </div>
        <p class="hero-meta reveal">
          <span><b>License:</b> MIT (code) · CC-BY-4.0 (spec)</span>
          <span><b>Validator:</b> @hardmachinelabs/index-ai-validator</span>
        </p>
      </div>

      <figure class="hero-figure reveal">
        <div class="hero-media">
          <video
            ref="videoEl"
            class="hero-video"
            controls
            preload="metadata"
            autoplay
            muted
            loop
            playsinline
            fetchpriority="high"
            aria-label="index-ai intro — a site layer readable by AI agents"
            @loadedmetadata="onLoadedMeta"
          >
            <source :src="videoSrc" type="video/mp4" />
          </video>
          <button
            v-if="showOverlay"
            class="vid-ph"
            type="button"
            aria-label="Play the index-ai intro video with sound"
            @click="playWithSound"
          >
            <span class="vid-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
            <span class="vid-note">Autoplay is blocked — click to play <b>with sound</b> · audio is included</span>
          </button>
        </div>
        <figcaption class="vid-cap">
          index-ai intro — the Agent View in action, playing in loop
          <b>with audio</b> (unmute via the video controls if autoplay starts muted).
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: calc(var(--vp-nav-height) + 2.5rem) 0 2rem;
}
.wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 1.75rem;
  position: relative;
  z-index: 1;
}
.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  gap: 2.5rem;
  align-items: center;
}
.hero-tag {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  margin-bottom: 0.875rem;
  display: inline-block;
}
.hero-title {
  font-size: clamp(2rem, 4.5vw, 2.75rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
  font-weight: 650;
  margin: 0;
  max-width: 16ch;
  overflow-wrap: anywhere;
  min-width: 0;
}
.hl {
  color: var(--vp-c-brand-1);
}
.hero-lede {
  font-size: 1.0625rem;
  color: var(--vp-c-text-2);
  line-height: 1.55;
  margin: 1rem 0 0;
  max-width: 52ch;
}
.hero-cta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.90625rem;
  font-weight: 600;
  padding: 0.75rem 1.375rem;
  border-radius: 10px;
  border: 1px solid transparent;
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.btn:active {
  transform: scale(0.98);
  transition-duration: 80ms;
}
.btn-primary {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--vp-c-brand-1) 30%, transparent),
    0 6px 20px color-mix(in srgb, var(--vp-c-brand-1) 18%, transparent);
}
.btn-primary:hover {
  background: var(--vp-c-brand-2);
  text-decoration: none;
}
.btn-soft {
  background: var(--vp-c-bg);
  border-color: var(--vp-c-border);
  color: var(--vp-c-text-2);
}
.btn-soft:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.hero-meta {
  margin-top: 1.5rem;
  font-size: 0.78125rem;
  color: var(--vp-c-text-3);
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
}
.hero-meta b {
  color: var(--vp-c-text-3);
  font-weight: 600;
}

.hero-figure {
  margin: 0;
  min-width: 0;
}
.hero-media {
  position: relative;
  width: calc(100% + clamp(0px, 12vw, calc(50vw - 540px + 1.75rem)));
  aspect-ratio: 16 / 9; /* native 1280x720 — no cropping (the v4 lesson) */
  border-radius: 16px;
  overflow: hidden;
  background: var(--vp-c-video-bg);
  box-shadow: 0 24px 48px -24px color-mix(in srgb, var(--vp-c-text-1) 24%, transparent);
}
.hero-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--vp-c-video-bg);
}
.vid-ph {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: color-mix(in srgb, var(--vp-c-term-bg) 55%, transparent);
  border: none;
  cursor: pointer;
  font: inherit;
  color: var(--vp-c-term-ink);
  transition: filter 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.vid-ph:hover {
  filter: brightness(0.94);
}
.vid-ph:active {
  filter: brightness(0.85);
}
.vid-play {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  display: grid;
  place-items: center;
  color: var(--vp-c-bg);
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px -8px color-mix(in srgb, var(--vp-c-brand-1) 45%, transparent);
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.vid-play:hover {
  transform: scale(1.06);
}
.vid-play:active {
  transform: scale(0.94);
}
.vid-play svg {
  width: 22px;
  height: 22px;
  margin-left: 3px;
}
.vid-note {
  font-size: 0.8125rem;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-term-ink);
  opacity: 0.85;
  text-align: center;
  padding-inline: 1rem;
}
.vid-cap {
  margin-top: 0.5rem;
  font-size: 0.78125rem;
  color: var(--vp-c-text-3);
  max-width: 56ch;
}
.vid-cap b {
  font-weight: 600;
  color: var(--vp-c-text-2);
}

/* Reveal stagger (validated v4). Hidden state ONLY under .js (progressive
   enhancement: no-JS/SSR and crawlers see content); reduced-motion forces
   opacity 1 — never an empty hero. */
.js .reveal {
  opacity: 0;
  transform: translateY(14px);
  animation: reveal-in 560ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--reveal-delay, 0ms);
}
@keyframes reveal-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .js .reveal {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 860px) {
  .hero {
    padding-top: calc(var(--vp-nav-height) + 1.5rem);
  }
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .hero-media {
    width: 100%;
    margin-right: 0;
  }
  .hero-title {
    font-size: clamp(2rem, 8vw, 2.5rem);
  }
}
</style>
