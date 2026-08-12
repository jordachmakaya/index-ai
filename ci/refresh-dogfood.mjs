#!/usr/bin/env node
/**
 * Refreshes the SERVED dogfood timestamps after `vitepress build`.
 *
 * docs/public/*.json are copied verbatim into docs/.vitepress/dist/, so the
 * checked-in copies carry commit-time values. This script patches the DIST
 * copies only — the deployed manifest and Agent View must report honest
 * freshness (SPEC §12.1, §7.9): `manifest_generated_at` / `generated` = build
 * time; `content_updated_at` = the last commit that touched docs/ content.
 * The working tree stays clean; the deployed files are always fresh.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'docs/.vitepress/dist')

const now = new Date().toISOString()

// Most recent content update = last commit touching docs/ (committer date).
// In CI this is the commit being deployed; locally it is the last docs edit.
const lastContentCommit = (() => {
  try {
    const out = execSync('git log -1 --format=%cI -- docs/', { cwd: root, encoding: 'utf8' }).trim()
    return out || now
  } catch {
    return now // no git context — fall back to build time
  }
})()

function patchManifest(doc) {
  doc.freshness.content_updated_at = lastContentCommit
  doc.freshness.manifest_generated_at = now
  return doc
}

function patchAgentIndex(doc) {
  doc.generated = now
  return doc
}

// [dist-relative path, patch] — the alias must be patched identically so the
// §5.2 fallback never drifts from the canonical manifest.
const targets = [
  ['.well-known/index-ai.json', patchManifest],
  ['index-ai.json', patchManifest],
  ['agent-index.json', patchAgentIndex],
]

for (const [rel, patch] of targets) {
  const file = resolve(dist, rel)
  if (!existsSync(file)) {
    // Freshness is a conformance rule (§12.1, §7.9) — fail loudly rather than
    // silently deploy stale dogfood timestamps.
    throw new Error(`refresh-dogfood: ${rel} not found in dist — dogfood freshness cannot be guaranteed`)
  }
  const doc = JSON.parse(readFileSync(file, 'utf8'))
  writeFileSync(file, `${JSON.stringify(patch(doc), null, 2)}\n`)
}

console.log('refresh-dogfood: dist dogfood timestamps refreshed')
