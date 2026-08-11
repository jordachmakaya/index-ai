<script setup lang="ts">
import { withBase } from 'vitepress'
import ParticlesBg from './ParticlesBg.vue'

// v4 Hero (H7): first-screen gist — what/why, status pill, CTAs, hero video at 16:9
// (asset is 1280x720, no cropping), particles background (Q4). withBase keeps the
// video working once base '/index-ai/' lands with the Pages deploy (T3.1).
const videoSrc = withBase('/index-ai-intro.mp4')
</script>

<template>
  <section class="hero">
    <ParticlesBg />
    <div class="hero-inner">
      <span class="hero-tag">A public standard for the machine web</span>
      <h1 class="hero-title">
        Make your content <span class="hl">verifiably readable</span> by AI agents.
      </h1>
      <p class="hero-lede">
        index-ai is an open specification that lets websites expose a structured layer for agents —
        who you are, what content exists, how big it is — measured and verified, not declared.
      </p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="/spec/">Read the specification</a>
        <a class="btn btn-soft" href="/quickstart">Follow the quickstart</a>
      </div>
      <p class="hero-meta">
        <b>License:</b> MIT (code) · CC-BY-4.0 (spec) &nbsp;·&nbsp;
        <b>Validator:</b> @hardmachinelabs/index-ai-validator
      </p>
      <div class="hero-media">
        <video
          class="hero-video"
          :src="videoSrc"
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
          aria-label="index-ai intro — a site layer readable by AI agents"
        ></video>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: calc(var(--vp-nav-height) + 3.5rem) 1.5rem 2rem;
  text-align: center;
}
.hero-inner {
  position: relative;
  max-width: 48rem;
  margin: 0 auto;
}
.hero-tag {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  margin-bottom: 1.25rem;
  display: inline-block;
}
.hero-title {
  font-size: clamp(2rem, 5vw, 2.75rem);
  line-height: 1.12;
  letter-spacing: -0.028em;
  font-weight: 750;
  margin: 0 auto 1.125rem;
  max-width: 42rem;
  overflow-wrap: break-word;
}
.hl {
  color: var(--vp-c-brand-1);
}
.hero-lede {
  font-size: 1.125rem;
  color: var(--vp-c-text-2);
  max-width: 40rem;
  margin: 0 auto 1.875rem;
}
.hero-cta {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
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
  margin-top: 1.625rem;
  font-size: 0.8125rem;
  color: var(--vp-c-text-2);
}
.hero-meta b {
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.hero-media {
  margin: 2.5rem auto 0;
  max-width: 54rem;
  aspect-ratio: 16 / 9; /* native 1280x720 — no cropping (the v4 lesson) */
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--vp-c-border);
  box-shadow: 0 24px 48px -24px color-mix(in srgb, var(--vp-c-text-1) 24%, transparent);
  background: #0a0a0a;
}
.hero-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
