/**
 * useValidatorState — pure, deterministic state logic for the Quickstart validator block (V-003).
 *
 * Posture (Q3 / C-002): the validator is NEVER embedded in the site. `npx` runs in the
 * reader's terminal. This module only renders deterministic DEMO states — zero network
 * calls in the static build. Kept as a pure module so the four states are unit-testable
 * without mounting a Vue component (@vue/test-utils is not in LIBS_REGISTRY).
 */

export type ValidatorState = 'loading' | 'empty' | 'verdict' | 'error'

export interface ValidatorLine {
  icon: 'ok' | 'warn' | 'err' | 'dim' | null
  text: string
}

export interface ValidatorView {
  title: string
  kind: ValidatorState
  lines: ValidatorLine[]
  /** True when this state carries a final conformance verdict line. */
  hasVerdict: boolean
}

export const VALIDATOR_STATES: ValidatorState[] = ['loading', 'empty', 'verdict', 'error']

export const DEMO_URL = 'https://your-site.com'

function line(icon: ValidatorLine['icon'], text: string): ValidatorLine {
  return { icon, text }
}

export function getLoadingView(): ValidatorView {
  return {
    title: 'validator',
    kind: 'loading',
    hasVerdict: false,
    lines: [
      line(null, '✓ /.well-known/index-ai.json — checking'),
      line(null, '✓ content_chars — measuring NFC code points'),
      line(null, '✓ DAG constraint — verifying'),
    ],
  }
}

export function getEmptyView(): ValidatorView {
  return {
    title: 'validator',
    kind: 'empty',
    hasVerdict: false,
    lines: [line(null, 'No index-ai manifest found at the provided URL.')],
  }
}

export function getVerdictView(): ValidatorView {
  return {
    title: `validator — ${DEMO_URL}`,
    kind: 'verdict',
    hasVerdict: true,
    lines: [
      line('ok', '/.well-known/index-ai.json found (3.1 KB)'),
      line('ok', 'Schema valid — Level 1'),
      line('ok', '/agent-index.json found (24 KB)'),
      line('ok', 'content_chars_mode present on all nodes with content_chars'),
      line('ok', 'content_chars verified against llm_url (18,400 NFC code points, mode: exact)'),
      line('ok', '6 nodes with content_chars and llm_url — Level 2a'),
      line('warn', 'publisher.verification_hint not set'),
      line('ok', 'Conformance: Level 2a — valid to ship'),
    ],
  }
}

/**
 * FR-4: the error state NAMES the exact failing field. `field` is optional demo
 * customization; the default demo names the three canonical failing fields.
 */
export function getErrorView(field?: string): ValidatorView {
  const lines: ValidatorLine[] = [
    line('err', '/.well-known/index-ai.json found (2.2 KB)'),
    line('err', field ?? 'identity.domain missing — add "domain": "your-site.com" to the manifest (§6.3)'),
    line(
      'err',
      field
        ? `node "article-rust-lifetimes": ${field} — must be fixed (§7.6)`
        : 'node "article-rust-lifetimes": content_chars_mode missing while content_chars is present — MUST be "exact" or "max" (§7.6)',
    ),
    line(
      'err',
      'node "about": llm_url returns 404 — the clean endpoint must serve Content-Type: text/markdown',
    ),
    line('dim', 'Conformance: Level 0 — not conformant (fix the fields above and re-run)'),
  ]
  return {
    title: `validator — ${DEMO_URL}`,
    kind: 'error',
    hasVerdict: true,
    lines,
  }
}

export function getValidatorView(state: ValidatorState, field?: string): ValidatorView {
  switch (state) {
    case 'loading':
      return getLoadingView()
    case 'empty':
      return getEmptyView()
    case 'verdict':
      return getVerdictView()
    case 'error':
      return getErrorView(field)
  }
}
