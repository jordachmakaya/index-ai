import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

// T-schema: the official JSON Schemas (schema/v1/) must exist, be valid JSON,
// and validate every JSON example embedded in the documentation (the canonical
// spec + the quickstart). This is the single-source-of-truth gate: an example
// that the spec ships as valid MUST pass the official schema, and a schema
// change MUST not reject an example the docs still publish.
//
// Manifest examples are detected by a top-level "identity" object; Agent View
// examples by a top-level "nodes" array. Fragment blocks (e.g. the
// `content_chars_measurement` snippet) are ignored — they are not documents.
// Negative fixtures prove the schemas REJECT documents the spec forbids.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const MANIFEST_SCHEMA_URL = 'https://raw.githubusercontent.com/jordachmakaya/index-ai/v1.0-rc1/schema/v1/index-ai.schema.json'
const AGENT_INDEX_SCHEMA_URL = 'https://raw.githubusercontent.com/jordachmakaya/index-ai/v1.0-rc1/schema/v1/agent-index.schema.json'

function readText(file: string): string {
  return readFileSync(resolve(root, file), 'utf8')
}

// Field-fragment blocks (e.g. `"content_chars_measurement": { ... }` alone) are
// NOT documents — they are inline excerpts of a single property. They begin with
// a quote. Documents begin with `{`.
function isFragment(raw: string): boolean {
  return raw.trimStart().startsWith('"')
}

function jsonBlocks(md: string): Array<{ line: number; json: unknown; raw: string }> {
  const blocks: Array<{ line: number; json: unknown; raw: string }> = []
  const re = /```json\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) {
    const raw = m[1]
    // line number = count of newlines before the match start
    const line = md.slice(0, m.index).split('\n').length
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch (err) {
      if (isFragment(raw)) continue // intentional single-property excerpt
      throw new Error(`docs JSON block at line ${line} is not valid JSON: ${(err as Error).message}`)
    }
    blocks.push({ line, json, raw })
  }
  return blocks
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

describe('official JSON Schemas (schema/v1/)', () => {
  it('both schemas exist and are valid JSON documents', () => {
    const manifest = JSON.parse(readText('schema/v1/index-ai.schema.json')) as unknown
    const agent = JSON.parse(readText('schema/v1/agent-index.schema.json')) as unknown
    expect(isRecord(manifest)).toBe(true)
    expect(isRecord(agent)).toBe(true)
    expect((manifest as Record<string, unknown>).type).toBe('object')
    expect((agent as Record<string, unknown>).type).toBe('object')
  })

  it('schema $id URLs point at the IMMUTABLE v1.0-rc1 tag (never the mutable main branch)', () => {
    const manifest = JSON.parse(readText('schema/v1/index-ai.schema.json')) as { $id?: string }
    const agent = JSON.parse(readText('schema/v1/agent-index.schema.json')) as { $id?: string }
    expect(manifest.$id).toBe(MANIFEST_SCHEMA_URL)
    expect(agent.$id).toBe(AGENT_INDEX_SCHEMA_URL)
    expect(manifest.$id).not.toContain('/main/')
    expect(agent.$id).not.toContain('/main/')
  })

  it('no docs example still references the dead index-ai/standard URLs', () => {
    for (const file of ['docs/spec/SPEC-v1.0-rc1.md', 'docs/quickstart.md']) {
      expect(readText(file), file).not.toContain('index-ai/standard')
    }
  })

  it('no published doc references the mutable main-branch schema URLs', () => {
    for (const file of ['docs/spec/SPEC-v1.0-rc1.md', 'docs/quickstart.md']) {
      expect(readText(file), file).not.toContain('jordachmakaya/index-ai/main/schema')
    }
  })

  it('the docs site implements index-ai (dogfood): its own manifest + Agent View pass the schemas', () => {
    // The site is a sub-path deployment: it must serve a manifest at an
    // arbitrary URL discoverable via rel="agent-manifest" (SPEC §5.2 Option B).
    const ajv = new Ajv({ allErrors: true })
    addFormats(ajv)
    const validateManifest = ajv.compile(JSON.parse(readText('schema/v1/index-ai.schema.json')))
    const validateAgentIndex = ajv.compile(JSON.parse(readText('schema/v1/agent-index.schema.json')))

    const manifest = JSON.parse(readText('docs/public/.well-known/index-ai.json')) as Record<string, unknown>
    const view = JSON.parse(readText('docs/public/agent-index.json')) as Record<string, unknown>

    const okM = validateManifest(manifest)
    expect(okM, `site manifest failed the official schema:\n${ajv.errorsText(validateManifest.errors)}`).toBe(true)
    const okV = validateAgentIndex(view)
    expect(okV, `site Agent View failed the official schema:\n${ajv.errorsText(validateAgentIndex.errors)}`).toBe(true)
  })
})

describe('docs examples validate against the official schemas', () => {
  const ajv = new Ajv({ allErrors: true })
  addFormats(ajv) // required: format: "date-time" is enforced, not ignored
  const validateManifest = ajv.compile(JSON.parse(readText('schema/v1/index-ai.schema.json')))
  const validateAgentIndex = ajv.compile(JSON.parse(readText('schema/v1/agent-index.schema.json')))

  for (const file of ['docs/spec/SPEC-v1.0-rc1.md', 'docs/quickstart.md']) {
    const blocks = jsonBlocks(readText(file))

    it(`${file}: every JSON block is valid JSON`, () => {
      // jsonBlocks already throws on invalid JSON — this test documents the intent
      expect(blocks.length).toBeGreaterThan(0)
    })

    it(`${file}: manifest examples pass the official index-ai.schema.json`, () => {
      const manifests = blocks.filter((b) => isRecord(b.json) && 'identity' in b.json && !('nodes' in b.json))
      expect(manifests.length, `${file} should embed ≥1 manifest example`).toBeGreaterThan(0)
      for (const b of manifests) {
        const ok = validateManifest(b.json)
        expect(
          ok,
          `${file}: manifest example at line ${b.line} failed the official schema:\n${ajv.errorsText(validateManifest.errors)}`,
        ).toBe(true)
      }
    })

    it(`${file}: Agent View examples pass the official agent-index.schema.json`, () => {
      const views = blocks.filter((b) => isRecord(b.json) && 'nodes' in b.json)
      expect(views.length, `${file} should embed ≥1 Agent View example`).toBeGreaterThan(0)
      for (const b of views) {
        const ok = validateAgentIndex(b.json)
        expect(
          ok,
          `${file}: Agent View example at line ${b.line} failed the official schema:\n${ajv.errorsText(validateAgentIndex.errors)}`,
        ).toBe(true)
      }
    })
  }
})

describe('negative fixtures — the schemas REJECT documents the spec forbids', () => {
  const ajv = new Ajv({ allErrors: true })
  addFormats(ajv)
  const validateManifest = ajv.compile(JSON.parse(readText('schema/v1/index-ai.schema.json')))
  const validateAgentIndex = ajv.compile(JSON.parse(readText('schema/v1/agent-index.schema.json')))

  const validManifest = {
    spec_version: '1.0-rc1',
    identity: { name: 'x', description: 'x' },
    freshness: { content_updated_at: '2026-08-12T10:00:00Z' },
  }
  const validAgentView = {
    generated: '2026-08-12T10:00:00Z',
    spec_version: '1.0-rc1',
    nodes: [
      {
        id: 'a',
        type: 'article',
        content: {
          llm_summary: 'summary',
          llm_url: '/a.md',
          content_chars: 10,
          content_chars_mode: 'exact',
          language: 'fr',
          content_sha256: 'a'.repeat(64),
        },
        relations: { parent: null, children: [], related: [] },
      },
    ],
  }

  it('baseline fixtures are valid (sanity check)', () => {
    expect(validateManifest(validManifest), ajv.errorsText(validateManifest.errors)).toBe(true)
    expect(validateAgentIndex(validAgentView), ajv.errorsText(validateAgentIndex.errors)).toBe(true)
  })

  const negativeManifest: Array<[string, Record<string, unknown>]> = [
    ['spec_version must be a version string ("banana")', { ...validManifest, spec_version: 'banana' }],
    ['content_updated_at must be a date-time ("yesterday")', { ...validManifest, freshness: { content_updated_at: 'yesterday' } }],
    ['identity.language must be ISO 639-1 ("eng")', { ...validManifest, identity: { name: 'x', description: 'x', language: ['eng'] } }],
  ]
  for (const [label, doc] of negativeManifest) {
    it(`manifest: rejects ${label}`, () => {
      expect(validateManifest(doc), `expected rejection for: ${label}`).toBe(false)
    })
  }

  const negativeAgent: Array<[string, Record<string, unknown>]> = [
    ['spec_version "banana"', { ...validAgentView, spec_version: 'banana' }],
    ['generated "never"', { ...validAgentView, generated: 'never' }],
    [
      'content_chars without llm_url',
      {
        ...validAgentView,
        nodes: [{ id: 'a', type: 'article', content: { llm_summary: 's', content_chars: 10, content_chars_mode: 'exact' } }],
      },
    ],
    [
      'relations.parent as a number (17)',
      { ...validAgentView, nodes: [{ ...validAgentView.nodes[0], relations: { parent: 17 } }] },
    ],
    [
      'relations.children containing a number ([999])',
      { ...validAgentView, nodes: [{ ...validAgentView.nodes[0], relations: { children: [999] } }] },
    ],
    [
      'relations.related as a bare string ("x")',
      { ...validAgentView, nodes: [{ ...validAgentView.nodes[0], relations: { related: 'x' } }] },
    ],
    ['content_sha256 not hex-64 ("zzz")', { ...validAgentView, nodes: [{ ...validAgentView.nodes[0], content: { ...validAgentView.nodes[0].content, content_sha256: 'zzz' } }] }],
    ['language three letters ("eng")', { ...validAgentView, nodes: [{ ...validAgentView.nodes[0], content: { ...validAgentView.nodes[0].content, language: 'eng' } }] }],
  ]
  for (const [label, doc] of negativeAgent) {
    it(`agent view: rejects ${label}`, () => {
      expect(validateAgentIndex(doc), `expected rejection for: ${label}`).toBe(false)
    })
  }
})
