<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  VALIDATOR_STATES,
  DEMO_URL,
  getValidatorView,
  type ValidatorState,
} from '../lib/useValidatorState'

// v4 ValidatorBlock (V-003): deterministic demo terminal with four states
// (loading / empty / verdict / error). NEVER runs the validator in the browser —
// `npx` executes in the reader's terminal (posture Q3/C-002). Zero network calls.
const state = ref<ValidatorState>('verdict')
const field = ref<string | undefined>(undefined)

const view = computed(() => getValidatorView(state.value, field.value))
const stateLabels: Record<ValidatorState, string> = {
  loading: 'Loading',
  empty: 'Empty',
  verdict: 'Data (pass)',
  error: 'Error (fail)',
}
const command = `npx @hardmachinelabs/index-ai-validator validate ${DEMO_URL}`
</script>

<template>
  <div class="vblock">
    <p class="vblock-hint">
      Run it against your deployed site — this block shows the four deterministic demo states:
    </p>
    <div class="code-block">
      <span class="p">$</span> npx <span class="ok">@hardmachinelabs/index-ai-validator</span> validate {{ DEMO_URL }}
      <button class="copy" type="button" @click="() => navigator.clipboard?.writeText(command)">
        Copy
      </button>
    </div>

    <div class="state-tabs" role="tablist" aria-label="Validator output states">
      <button
        v-for="s in VALIDATOR_STATES"
        :key="s"
        type="button"
        role="tab"
        :aria-selected="state === s"
        :class="['state-tab', { on: state === s }]"
        @click="state = s"
      >
        {{ stateLabels[s] }}
      </button>
    </div>

    <div class="term" role="tabpanel" :aria-label="`Validator ${stateLabels[state]} output`">
      <div class="term-head">
        <span class="dot r" aria-hidden="true"></span>
        <span class="dot y" aria-hidden="true"></span>
        <span class="dot g" aria-hidden="true"></span>
        <span class="term-title">{{ view.title }}</span>
      </div>

      <div
        class="term-body"
        aria-live="polite"
        :aria-busy="state === 'loading'"
      >
        <template v-if="state === 'loading'">
          <span v-for="(l, i) in view.lines" :key="i" class="shimmer">{{ l.text }}</span>
        </template>

        <template v-else-if="state === 'empty'">
          <div class="empty-state">
            <div class="e-icon" aria-hidden="true">?</div>
            <p><b>No index-ai manifest found</b> at the provided URL.</p>
            <a class="btn-soft" href="#step-1">Back to step 1</a>
          </div>
        </template>

        <template v-else>
          <span v-for="(l, i) in view.lines" :key="i" :class="[l.icon, { dim: l.icon === 'dim' }]">
            {{ l.icon === 'ok' ? '  ✓' : l.icon === 'warn' ? '  ⚠' : l.icon === 'err' ? '  ✗' : '  →' }} {{ l.text }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vblock {
  margin: 1.5rem 0;
}
.vblock-hint {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin: 0 0 0.75rem;
}
.code-block {
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  line-height: 1.7;
  background: var(--vp-c-term-bg);
  color: var(--vp-c-term-ink);
  border-radius: 10px;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  margin: 0 0 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.code-block .p {
  color: var(--vp-c-term-dim);
}
.code-block .ok {
  color: var(--vp-c-term-ok);
}
.copy {
  margin-left: auto;
  font-family: var(--vp-font-family-base);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 20%, transparent);
  padding: 0.3125rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.copy:hover {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}

.state-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1.25rem 0 0.5rem;
}
.state-tab {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  padding: 0.3125rem 0.75rem;
  border-radius: 100px;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
.state-tab:hover {
  border-color: var(--vp-c-brand-1);
}
.state-tab.on {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.term {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--vp-c-text-1) 3%, transparent),
    0 12px 32px color-mix(in srgb, var(--vp-c-text-1) 5%, transparent);
}
.term-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg-soft);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.r { background: var(--vp-c-dot-r); }
.dot.y { background: var(--vp-c-dot-y); }
.dot.g { background: var(--vp-c-dot-g); }
.term-title {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-left: 0.5rem;
}
.term-body {
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  line-height: 1.8;
  padding: 1.125rem 1.25rem;
  background: var(--vp-c-term-bg);
  color: var(--vp-c-term-ink);
  display: flex;
  flex-direction: column;
}
.term-body .ok { color: var(--vp-c-term-ok); }
.term-body .warn { color: var(--vp-c-term-warn); }
.term-body .err { color: var(--vp-c-term-err); }
.term-body .dim { color: var(--vp-c-term-dim); }
.term-body b { color: var(--vp-c-term-ink); }

.shimmer {
  background: linear-gradient(
    90deg,
    var(--vp-c-term-shimmer) 25%,
    var(--vp-c-term-shimmer-2) 37%,
    var(--vp-c-term-shimmer) 63%
  );
  background-size: 400% 100%;
  animation: shimmer-anim 1.4s ease infinite;
  border-radius: 4px;
  color: transparent !important;
  user-select: none;
}
@keyframes shimmer-anim {
  0% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.empty-state {
  text-align: center;
  padding: 1.75rem 1.25rem;
  border: 1px dashed var(--vp-c-border);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.e-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 12px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  display: grid;
  place-items: center;
  margin: 0 auto 0.75rem;
  font-family: var(--vp-font-family-mono);
  font-size: 1rem;
  font-weight: 600;
}
.empty-state p {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin: 0 0 0.75rem;
}
.btn-soft {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  text-decoration: none;
}
.btn-soft:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

@media (prefers-reduced-motion: reduce) {
  .shimmer {
    animation: none;
  }
}
</style>
