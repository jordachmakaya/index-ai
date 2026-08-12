import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

// T-MCP: the Level 3 example in the spec must conform to the Model Context
// Protocol — `inputSchema` is a JSON Schema object (not a Zod schema), and the
// handler returns a CallToolResult with `content` (and optionally
// `structuredContent`), not a custom `{ _meta, results }` envelope.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const specPath = resolve(root, 'docs/spec/SPEC-v1.0-rc1.md')
const spec = readFileSync(specPath, 'utf8')

// The JSON Schema the spec's §8.5 example declares for `search_hotels`.
// Kept in sync with the spec block (see the "Complete tool example" section).
const searchHotelsInputSchema = {
  type: 'object',
  properties: {
    location: {
      type: 'string',
      description: "City name (e.g. 'Casablanca') or GPS coordinates ('33.5731,-7.5898')",
    },
    radius_km: { type: 'number', default: 10, description: 'Search radius in kilometers. Default: 10' },
    checkin: { type: 'string', format: 'date', description: 'Check-in date in YYYY-MM-DD format' },
    checkout: { type: 'string', format: 'date', description: 'Check-out date in YYYY-MM-DD format' },
    budget_max_mad: { type: 'number', description: 'Maximum price per night in MAD' },
    stars_min: { type: 'integer', minimum: 1, maximum: 5, description: 'Minimum star rating (1–5)' },
    guests: { type: 'integer', minimum: 1, default: 1, description: 'Number of guests' },
  },
  required: ['location'],
} as const

describe('Level 3 MCP example (spec §8.5)', () => {
  it('uses the official Model Context Protocol SDK', () => {
    expect(spec).toContain('@modelcontextprotocol/sdk')
    expect(spec).toContain('McpServer')
    expect(spec).toContain('StdioServerTransport')
  })

  it('inputSchema is plain JSON Schema — no z.object, no custom envelope', () => {
    // The old example used z.object() and returned { _meta, results }.
    const section = spec.slice(spec.indexOf('### 8.5 Complete tool example'), spec.indexOf('### 8.6'))
    expect(section).not.toContain('z.object')
    expect(section).not.toContain('execute:')
    expect(section).not.toContain('results: results.map')
    expect(section).toContain('inputSchema: {')
    expect(section).toContain('type: "object"')
  })

  it('the response is a CallToolResult with content and structuredContent', () => {
    const section = spec.slice(spec.indexOf('### 8.5 Complete tool example'), spec.indexOf('### 8.6'))
    expect(section).toContain('content: [{ type: "text", text: JSON.stringify(hotels) }]')
    expect(section).toContain('structuredContent')
    expect(section).toContain('isError: false')
  })

  it('the inputSchema is a valid JSON Schema that accepts documented arguments', () => {
    const ajv = new Ajv({ allErrors: true })
    addFormats(ajv)
    const validate = ajv.compile(searchHotelsInputSchema)
    const args = { location: 'Casablanca', radius_km: 20, guests: 2 }
    expect(validate(args), ajv.errorsText(validate.errors)).toBe(true)
    // `location` is required
    expect(validate({ radius_km: 20 })).toBe(false)
  })
})
