import { describe, it, expect } from 'vitest'
import {
  VALIDATOR_STATES,
  DEMO_URL,
  getValidatorView,
  getLoadingView,
  getEmptyView,
  getVerdictView,
  getErrorView,
} from '../docs/.vitepress/theme/lib/useValidatorState'

// V-003 quickstart validator block: the four deterministic demo states (test-patterns).
// The state logic is a pure module (no DOM, no network) — unit-testable without
// @vue/test-utils (not in LIBS_REGISTRY); the rendered component is covered by E2E.

describe('useValidatorState (V-003)', () => {
  it('exposes exactly the four required states', () => {
    expect(VALIDATOR_STATES).toEqual(['loading', 'empty', 'verdict', 'error'])
  })

  it('loading state renders shimmer lines with no verdict', () => {
    const v = getLoadingView()
    expect(v.kind).toBe('loading')
    expect(v.hasVerdict).toBe(false)
    expect(v.lines.length).toBeGreaterThanOrEqual(3)
  })

  it('empty state states no manifest found', () => {
    const v = getEmptyView()
    expect(v.kind).toBe('empty')
    expect(v.lines[0].text).toMatch(/No index-ai manifest found/i)
  })

  it('verdict state reports partial conformance as valid to ship (edge case 1)', () => {
    const v = getVerdictView()
    expect(v.kind).toBe('verdict')
    expect(v.hasVerdict).toBe(true)
    expect(v.lines.some((l) => l.text.includes('valid to ship'))).toBe(true)
    expect(v.lines.some((l) => l.text.includes('Level 2a'))).toBe(true)
  })

  it('error state names the exact failing field (FR-4)', () => {
    const v = getErrorView()
    expect(v.kind).toBe('error')
    expect(v.lines.some((l) => l.text.includes('identity.domain missing'))).toBe(true)
    expect(v.lines.some((l) => l.text.includes('content_chars_mode missing'))).toBe(true)
    expect(v.lines.some((l) => l.text.includes('llm_url returns 404'))).toBe(true)
    expect(v.hasVerdict).toBe(true)
  })

  it('error state honours a custom failing field', () => {
    const v = getErrorView('spec_version invalid')
    expect(v.lines.some((l) => l.text.includes('spec_version invalid'))).toBe(true)
  })

  it('getValidatorView dispatches by state and demo URL is constant', () => {
    expect(getValidatorView('verdict').kind).toBe('verdict')
    expect(getValidatorView('error', 'x').kind).toBe('error')
    expect(DEMO_URL).toBe('https://your-site.com')
  })
})
