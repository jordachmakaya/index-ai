import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// T3.0 quality gate: the free-tier GitHub Actions workflow must exist, trigger
// on pull_request + push, install with a frozen lockfile, run the local gates
// (typecheck/lint/vitest/docs build), map every invoked command to a REAL
// package.json script, and never reference the gitignored `.shokunin/` tree
// (public-repo rule C-001).

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workflowPath = resolve(root, '.github/workflows/quality.yml')
const pkgPath = resolve(root, 'package.json')

function workflowBody(): string {
  expect(existsSync(workflowPath), `workflow ${workflowPath} must exist`).toBe(true)
  return readFileSync(workflowPath, 'utf8')
}

describe('quality gate (T3.0)', () => {
  it('workflow exists and triggers on pull_request and push', () => {
    const wf = workflowBody()
    expect(wf).toMatch(/on:/)
    expect(wf).toMatch(/pull_request/)
    expect(wf).toMatch(/push:/)
  })

  it('uses free-tier runner and a frozen-lockfile pnpm install', () => {
    const wf = workflowBody()
    expect(wf).toMatch(/runs-on: ubuntu-latest/)
    expect(wf).toMatch(/pnpm install --frozen-lockfile/)
    expect(wf).toMatch(/actions\/setup-node@v4/)
    expect(wf).toMatch(/cache: pnpm/)
  })

  it('locks the pnpm version to the local toolchain (packageManager)', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { packageManager?: string }
    expect(pkg.packageManager).toMatch(/^pnpm@/)
  })

  it('runs the local gates: typecheck, lint, unit tests, docs build', () => {
    const wf = workflowBody()
    expect(wf).toMatch(/pnpm typecheck/)
    expect(wf).toMatch(/pnpm lint/)
    expect(wf).toMatch(/pnpm test/)
    expect(wf).toMatch(/pnpm docs:build/)
  })

  it('every invoked pnpm command maps to a real package.json script', () => {
    const wf = workflowBody()
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> }
    expect(pkg.scripts).toBeTruthy()
    // pnpm native commands (install/exec/run) are not package.json scripts
    const native = new Set(['install', 'exec', 'run', 'add', 'remove'])
    const invoked = [...wf.matchAll(/pnpm ([a-z:]+)/g)]
      .map((m) => m[1])
      .filter((s) => !native.has(s))
    expect(invoked.length).toBeGreaterThan(0)
    for (const script of invoked) {
      expect(pkg.scripts?.[script], `script "${script}" must exist in package.json`).toBeTruthy()
    }
  })

  it('never references the gitignored .shokunin tree (C-001 public repo)', () => {
    const wf = workflowBody()
    expect(wf).not.toContain('.shokunin')
  })
})
