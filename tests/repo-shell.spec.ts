import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// T1.0 repo shell (FR-6): a stranger landing on the repo root must see the
// license, contribution guide, and spec pointers WITHOUT subfolder navigation.
// The dual license is represented by two root files — LICENSE (MIT for code) and
// LICENSE-SPEC (CC-BY-4.0 notice for spec text) — the split README and
// CONTRIBUTING both reference.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readRootFile(name: string): string {
  const p = resolve(root, name)
  expect(existsSync(p), `${name} must exist at the repo root`).toBe(true)
  const body = readFileSync(p, 'utf8')
  expect(body.length, `${name} must not be empty`).toBeGreaterThan(0)
  expect(dirname(p), `${name} must sit directly under the repo root`).toBe(root)
  return body
}

describe('repo shell (T1.0)', () => {
  it('README.md exists at the root and is non-empty', () => {
    expect(readRootFile('README.md').length).toBeGreaterThan(100)
  })

  it('LICENSE carries the MIT header for code', () => {
    const license = readRootFile('LICENSE')
    expect(license).toMatch(/MIT License/)
    expect(license).toMatch(/Permission is hereby granted/)
  })

  it('LICENSE-SPEC exposes the CC-BY-4.0 notice for the spec text at the root', () => {
    const specLicense = readRootFile('LICENSE-SPEC')
    expect(specLicense).toMatch(/Creative Commons Attribution 4\.0/)
    expect(specLicense).toMatch(/CC-BY-4\.0/)
  })

  it('CONTRIBUTING.md exists at the root, states version immutability, and names both licenses', () => {
    const contributing = readRootFile('CONTRIBUTING.md')
    expect(contributing).toMatch(/published spec versions are immutable/i)
    expect(contributing).toMatch(/MIT/)
    expect(contributing).toMatch(/CC-BY-4\.0/)
  })
})
