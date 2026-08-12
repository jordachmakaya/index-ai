import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createMcpApp } from '../examples/mcp-server/server'

// T-MCP (integration): the Level 3 example (examples/mcp-server/server.ts) is
// not just prose — it must BOOT and serve the real MCP protocol over HTTP.
// This test starts the example's Express app on an ephemeral port and drives
// it with raw JSON-RPC (initialize → initialized → tools/list → tools/call).
//
// Streamable HTTP notes (verified against SDK v1.30):
// - the transport requires the client to accept BOTH application/json AND
//   text/event-stream (else -32000 "Not Acceptable");
// - responses are delivered as SSE (`event: message` / `data: {...}`) and the
//   stream stays open, so the test reads exactly one complete event then
//   aborts the connection.

let server: Server | null = null
let port = 0

const MCP_ACCEPT = 'application/json, text/event-stream'

/** Reads one complete SSE `data:` payload (or a plain JSON body) then closes. */
async function rpcCall(body: unknown): Promise<Record<string, unknown>> {
  const ac = new AbortController()
  try {
    const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: MCP_ACCEPT },
      body: JSON.stringify(body),
      signal: ac.signal,
    })
    expect(res.status).toBe(200)
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/event-stream')) {
      return (await res.json()) as Record<string, unknown>
    }
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    let dataLine: string | null = null
    while (dataLine === null) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const events = buf.split('\n\n')
      buf = events.pop() ?? ''
      for (const ev of events) {
        const line = ev.split('\n').find((l) => l.startsWith('data:'))
        if (line) {
          dataLine = line.slice(5).trim()
          break
        }
      }
    }
    expect(dataLine, 'SSE response must carry a data: payload').toBeTruthy()
    return JSON.parse(dataLine!) as Record<string, unknown>
  } finally {
    ac.abort()
  }
}

/** Sends a notification (no response body expected) and closes. */
async function sendNotification(body: unknown): Promise<number> {
  const ac = new AbortController()
  try {
    const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: MCP_ACCEPT },
      body: JSON.stringify(body),
      signal: ac.signal,
    })
    return res.status
  } finally {
    ac.abort()
  }
}

describe('Level 3 MCP example boots and serves the protocol (examples/mcp-server)', () => {
  beforeAll(async () => {
    server = createServer(createMcpApp())
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve))
    port = (server.address() as AddressInfo).port
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => server?.close(() => resolve()))
    server?.closeAllConnections()
  })

  it('serves MCP initialize and identifies as atlas-hotels', async () => {
    const res = await rpcCall({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'index-ai-test', version: '0.0.0' },
      },
    })
    expect(res.jsonrpc).toBe('2.0')
    expect((res.result as Record<string, unknown>).serverInfo).toMatchObject({
      name: 'atlas-hotels',
      version: '1.0.0',
    })
  })

  it('accepts the initialized notification, then lists search_hotels with a JSON Schema inputSchema', async () => {
    const status = await sendNotification({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    })
    expect(status).toBeLessThan(300)

    const res = await rpcCall({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })
    const tools = (res.result as { tools?: unknown[] }).tools ?? []
    expect(tools.length).toBeGreaterThan(0)
    const tool = tools[0] as { name: string; inputSchema: { type: string; required?: string[] } }
    expect(tool.name).toBe('search_hotels')
    // On the wire, the SDK publishes the Zod shape as plain JSON Schema.
    expect(tool.inputSchema.type).toBe('object')
    expect(tool.inputSchema.required).toContain('location')
  })

  it('calls search_hotels and returns content + structuredContent + _meta', async () => {
    const res = await rpcCall({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'search_hotels', arguments: { location: 'Casablanca', stars_min: 5 } },
    })
    const result = res.result as {
      content: Array<{ type: string; text?: string }>
      structuredContent: { total: number }
      _meta: { generated_at: string; source: string }
      isError: boolean
    }
    expect(result.isError).toBe(false)
    expect(result.content[0].type).toBe('text')
    expect(result.structuredContent.total).toBe(3) // 3 five-star Casablanca hotels
    // SPEC §8.4: _meta MUST carry generated_at (ISO 8601) and source (domain).
    expect(result._meta.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(result._meta.source).toBe('atlashotels.ma')
  })
})
