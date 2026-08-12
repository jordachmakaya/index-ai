import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// T-MCP (static): the Level 3 section of the spec (SPEC-v1.0-rc1 §8.5) must
// describe a protocol-conformant, EXECUTABLE server — the full implementation
// lives at examples/mcp-server/server.ts and is boot-tested over real HTTP by
// tests/mcp-server.spec.ts (initialize → tools/list → tools/call). This test
// pins the spec prose to that reality so a future edit can't silently drift
// back to a non-executable or non-conformant example.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const specPath = resolve(root, 'docs/spec/SPEC-v1.0-rc1.md')
const spec = readFileSync(specPath, 'utf8')
const section = spec.slice(spec.indexOf('### 8.5 Complete tool example'), spec.indexOf('### 8.6'))

describe('Level 3 MCP section (spec §8.5)', () => {
  it('points at the executable example and pins the SDK version', () => {
    expect(section).toContain('examples/mcp-server/server.ts')
    expect(section).toContain('@modelcontextprotocol/sdk')
    expect(section).toContain('v1.30')
  })

  it('uses Streamable HTTP to match the remote manifest URL — never Stdio', () => {
    expect(section).toContain('StreamableHTTPServerTransport')
    expect(section).toContain('createMcpExpressApp')
    // Stdio may appear in prose as the anti-pattern, but never as an import.
    expect(section).not.toContain('from "@modelcontextprotocol/sdk/server/stdio.js"')
    expect(section).not.toContain('stdio.js')
  })

  it('declares the SDK v1 Zod inputSchema API and the JSON Schema wire format', () => {
    // SDK v1 McpServer.registerTool takes a Zod raw shape; the wire format
    // (Tool.inputSchema) is JSON Schema. A raw JSON Schema object is rejected
    // at runtime by v1.30 — the prose must not claim otherwise.
    expect(section).toContain('Zod raw shape')
    expect(section).toContain('z.string()')
    expect(section).toContain('JSON Schema')
  })

  it('requires _meta (generated_at + source) in the tool response', () => {
    // SPEC §8.4 mandates _meta; the example must include it, not treat it as
    // optional. No custom `{ _meta, results }` envelope may reappear.
    expect(section).toContain('_meta MUST carry generated_at')
    expect(section).toContain('_meta: { generated_at: new Date().toISOString(), source: "atlashotels.ma" }')
    expect(section).not.toContain('results: results.map')
    expect(section).not.toContain('execute:')
  })

  it('documents how to run the server', () => {
    expect(section).toContain('pnpm tsx examples/mcp-server/server.ts')
  })
})
