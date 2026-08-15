<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Validated v4 theme toggle (dir_3_v4.html `.toggle`): a 44×26 switch whose 18px
// knob carries sun/moon SVGs, sliding 18px in dark. It drives the SAME `.dark`
// class + localStorage key VitePress uses, so the tokens flip identically.
const dark = ref(false)

function readStored(): 'dark' | 'light' | null {
  try {
    const v = localStorage.getItem('vitepress-theme-appearance')
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null // private mode / SSR
  }
}

function apply(next: boolean) {
  dark.value = next
  document.documentElement.classList.toggle('dark', next)
  try {
    localStorage.setItem('vitepress-theme-appearance', next ? 'dark' : 'light')
  } catch {
    /* private mode */
  }
}

function onToggle() {
  apply(!dark.value)
}

let cleanup: (() => void) | null = null

onMounted(() => {
  // Initial sync: stored preference wins, else system preference — the same
  // resolution VitePress's head script already applied to `.dark`.
  const stored = readStored()
  apply(stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Keep knob + `.dark` in sync across tabs (VitePress's own composable listens
  // to the same `storage` event) and with system changes when no preference is
  // stored — mirrors the validated v4 behavior.
  const onStorage = () => {
    const s = readStored()
    if (s) apply(s === 'dark')
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onMq = () => {
    if (!readStored()) apply(mq.matches)
  }
  window.addEventListener('storage', onStorage)
  mq.addEventListener('change', onMq)
  cleanup = () => {
    window.removeEventListener('storage', onStorage)
    mq.removeEventListener('change', onMq)
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :class="{ dark }"
    role="switch"
    :aria-checked="dark"
    aria-label="Toggle dark mode"
    @click="onToggle"
  >
    <span class="knob">
      <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: relative;
  width: 44px;
  height: 26px;
  border-radius: 9999px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  flex: none;
  transition: border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.theme-toggle:hover {
  border-color: var(--vp-c-brand-1);
}
.theme-toggle:active .knob {
  transform: scale(0.92);
}
.theme-toggle.dark .knob {
  transform: translateX(18px);
}
.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  display: grid;
  place-items: center;
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.knob svg {
  width: 11px;
  height: 11px;
}
.sun {
  display: none;
}
.moon {
  display: block;
  color: var(--vp-c-bg);
}
.theme-toggle.dark .sun {
  display: block;
  color: var(--vp-c-bg);
}
.theme-toggle.dark .moon {
  display: none;
}
</style>
