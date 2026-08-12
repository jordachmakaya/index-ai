import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// T1.1 issue templates (FR-7): a stranger hitting "New issue" gets guided
// choices, not a blank box. The dependency set is frozen (no YAML library may be
// added — JOB constraint), so this validates the GitHub issue-form subset the
// templates actually use: top-level keys, body blocks each carrying a typed
// input, consistent `- type:` indentation, and double-quote balance that a real
// YAML parser would reject.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templateDir = resolve(root, '.github/ISSUE_TEMPLATE')

const INPUT_TYPES = new Set(['input', 'textarea', 'dropdown', 'checkboxes'])
const CONFIG_FILE = 'config.yml'

interface BodyBlock {
  type: string
  hasLabelOrValue: boolean
}

interface ParsedForm {
  keys: string[]
  labels: string[]
  body: BodyBlock[]
  typeIndents: number[]
}

// Structural reader for the fixed issue-form subset (NOT a general YAML parser).
function parseIssueForm(text: string): ParsedForm {
  const keys: string[] = []
  const labels: string[] = []
  const body: BodyBlock[] = []
  const typeIndents: number[] = []
  let inBody = false
  let current: BodyBlock | null = null

  for (const raw of text.split('\n')) {
    const trimmed = raw.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const indent = raw.length - raw.trimStart().length

    if (indent === 0) {
      const top = /^([a-z_]+):(?:\s*(.*))?$/.exec(trimmed)
      if (!top) continue
      keys.push(top[1])
      if (top[1] === 'body') inBody = true
      else if (top[1] === 'labels') {
        for (const m of top[2].matchAll(/"([^"]+)"/g)) labels.push(m[1])
      }
      current = null
      continue
    }

    if (!inBody) continue

    const entry = /^- type:\s*([a-z_]+)$/.exec(trimmed)
    if (entry) {
      current = { type: entry[1], hasLabelOrValue: false }
      body.push(current)
      typeIndents.push(indent)
      continue
    }

    if (current) {
      const attr = /^([a-z_]+):\s*(.*)$/.exec(trimmed)
      if (attr && (attr[1] === 'label' || attr[1] === 'value' || attr[1] === 'placeholder')) {
        current.hasLabelOrValue = true
      }
    }
  }
  return { keys, labels, body, typeIndents }
}

// Block-scalar-aware double-quote balance: quotes inside a `|`/`>` block are
// literal text and must be ignored; a stray quote anywhere else breaks the file.
function findQuoteError(lines: string[]): string | null {
  let blockIndent: number | null = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const indent = line.length - line.trimStart().length
    if (blockIndent !== null) {
      if (indent >= blockIndent) continue
      blockIndent = null
    }
    if (/:\s*[|>]\s*$/.test(line.trimEnd())) {
      let j = i + 1
      while (j < lines.length && !lines[j].trim()) j++
      blockIndent = j < lines.length ? lines[j].length - lines[j].trimStart().length : null
      continue
    }
    if ((line.match(/"/g) ?? []).length % 2 !== 0) return line
  }
  return null
}

function templateFiles(): string[] {
  return readdirSync(templateDir).filter((f) => f.endsWith('.yml') && f !== CONFIG_FILE)
}

describe('issue templates (T1.1)', () => {
  it('exposes at least three guided templates (FR-7, no blank box)', () => {
    expect(templateFiles().length).toBeGreaterThanOrEqual(3)
  })

  it('each template parses with name/description/title/labels/body and a typed input', () => {
    for (const f of templateFiles()) {
      const text = readFileSync(join(templateDir, f), 'utf8')
      expect(findQuoteError(text.split('\n')), `${f}: unbalanced double quotes`).toBeNull()

      const form = parseIssueForm(text)
      for (const key of ['name', 'description', 'title', 'labels', 'body']) {
        expect(form.keys, `${f}: missing key "${key}"`).toContain(key)
      }
      expect(form.body.length, `${f}: body must not be empty`).toBeGreaterThan(0)
      expect(new Set(form.typeIndents).size, `${f}: inconsistent - type indentation`).toBe(1)
      expect(
        form.body.some((b) => INPUT_TYPES.has(b.type) && b.hasLabelOrValue),
        `${f}: at least one typed input with a label is required`,
      ).toBe(true)
    }
  })

  it('covers the three guided flows: bug report, question, spec feedback', () => {
    const files = templateFiles()
    for (const expected of ['bug_report.yml', 'question.yml', 'spec_feedback.yml']) {
      expect(files, `${expected} must exist`).toContain(expected)
    }
    const labels = new Set<string>()
    for (const f of files) {
      for (const l of parseIssueForm(readFileSync(join(templateDir, f), 'utf8')).labels) labels.add(l)
    }
    expect(labels.has('bug'), 'a bug template must be labeled').toBe(true)
    expect(labels.has('question'), 'a question template must be labeled').toBe(true)
  })

  it('config.yml disables blank issues and routes strangers to the docs', () => {
    const text = readFileSync(join(templateDir, CONFIG_FILE), 'utf8')
    expect(text).toMatch(/blank_issues_enabled:\s*false/)
    expect(text).toMatch(/contact_links:/)
    expect(text).toMatch(/url:\s*https:\/\//)
  })
})
