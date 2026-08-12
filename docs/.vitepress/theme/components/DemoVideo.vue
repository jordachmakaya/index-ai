<script setup lang="ts">
// v4 DemoVideo (V-004 · 2026-08-12): the re-encoded AI-readiness walkthrough
// (49 MB → 1.1 MB, H.264 1280×524 2.44:1, faststart) played inside the
// Demonstration 16:9 frame — letterboxed on the video-bg surface. withBase
// keeps the asset working under the Pages base path ('/index-ai/'), same
// pattern as the hero intro video.
import { withBase } from 'vitepress'

const src = withBase('/videos/ai-readiness.mp4')
const poster = withBase('/videos/ai-readiness-poster.jpg')
</script>

<template>
  <div class="demo-vid-frame">
    <video
      controls
      preload="metadata"
      playsinline
      :src="src"
      :poster="poster"
      aria-label="AI-readiness demonstration — the Agent View in action"
    ></video>
  </div>
</template>

<style scoped>
.demo-vid-frame {
  aspect-ratio: 16 / 9;
  margin-top: 1.5rem;
  background: var(--vp-c-video-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 16px;
  overflow: hidden;
}
.demo-vid-frame video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
