<script setup lang="ts">
// v4 DemoVideo (V-004 · 2026-08-12): the re-encoded AI-readiness walkthrough
// (49 MB → 1.1 MB, H.264 1280×524 2.44:1, faststart) played inside the
// Demonstration 16:9 frame — letterboxed on the video-bg surface. withBase
// keeps the asset working under the Pages base path ('/index-ai/'), same
// pattern as the hero intro video.
// Default playback rate is 1.5x (client request 2026-08-12): playbackRate is
// not an HTML attribute, so it is set once metadata loads — the user keeps
// full control afterwards via the native speed control.
import { withBase } from 'vitepress'
import { ref } from 'vue'

const src = withBase('/videos/ai-readiness.mp4')
const poster = withBase('/videos/ai-readiness-poster.jpg')
const videoEl = ref<HTMLVideoElement | null>(null)

function applyDefaultRate() {
  if (videoEl.value) videoEl.value.playbackRate = 1.5
}
</script>

<template>
  <div class="demo-vid-frame">
    <video
      ref="videoEl"
      controls
      preload="metadata"
      playsinline
      :src="src"
      :poster="poster"
      @loadedmetadata="applyDefaultRate"
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
