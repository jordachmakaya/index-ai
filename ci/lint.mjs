#!/usr/bin/env node
// Lint (public, tracked — C-001): static checks over theme + e2e + tests.
// 1. No v-html / innerHTML anywhere in our components (XSS surface).
// 2. No SENSITIVE data in localStorage/sessionStorage (z6 invariant
//    Storage ∩ Sensitive = ∅) — per LINE, matching real credential patterns
//    (api keys, secrets, passwords, credentials, JWTs, auth tokens).
//    A theme preference ('dark'/'light') is NOT sensitive, so it's allowed.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const roots = ['docs/.vitepress/theme', 'e2e', 'tests']
const FILE_RE = /\.(vue|ts|tsx|mjs)$/
const XSS_RE = /v-html|innerHTML/
const STORAGE_RE = /localStorage|sessionStorage/
// Real credential patterns (NOT generic "tokens" — design tokens are fine).
const SENSITIVE_RE = /api[_-]?key|secret|password|credential|jwt|access[_-]?token|refresh[_-]?token|authorization/i

const bad = []

// Strip comment content BEFORE matching, so a comment mentioning a sensitive
// word (or v-html) next to a storage call can never false-positive — the exact
// bug class this linter was created to kill ("the tokens flip" comment).
function stripComments(line) {
  return line.replace(/\/\/.*$/, '').replace(/<!--.*?-->/g, '')
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, entry.name)
    if (entry.isDirectory()) walk(f)
    else if (FILE_RE.test(entry.name)) {
      const s = readFileSync(f, 'utf8')
      const lines = s.split('\n')
      if (lines.some((line) => XSS_RE.test(stripComments(line)))) {
        bad.push(`${f}: v-html/innerHTML`)
      }
      const hit = lines.some((line) => STORAGE_RE.test(stripComments(line)) && SENSITIVE_RE.test(stripComments(line)))
      if (hit) bad.push(`${f}: sensitive value in client storage`)
    }
  }
}

for (const r of roots) walk(r)

if (bad.length) {
  console.error('lint fail:')
  for (const b of bad) console.error(`  - ${b}`)
  process.exit(1)
}
console.log('lint: clean (0 v-html · 0 sensitive storage)')
