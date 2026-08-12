/**
 * index-ai Level 3 — executable MCP server example (SPEC-v1.0-rc2 §8.5).
 *
 * Protocol facts this example proves (all verified against
 * `@modelcontextprotocol/sdk` v1.30):
 *
 * - Streamable HTTP transport (`StreamableHTTPServerTransport`) hosted behind
 *   Express — matching the `access.mcp_server` HTTPS URL the manifest declares,
 *   NOT Stdio (a local-process transport would contradict a remote manifest).
 * - The official v1 SDK API: `McpServer.registerTool` takes a **Zod raw shape**
 *   as `inputSchema` (SDK v1 is Zod-based; `zod-to-json-schema` compiles it to
 *   the plain JSON Schema that the MCP protocol transmits in `Tool.inputSchema`
 *   — any MCP client can validate arguments without sharing application code).
 * - The handler returns a protocol `CallToolResult`: `content` (text blocks)
 *   plus `structuredContent`, and the index-ai-required `_meta` carrying
 *   `generated_at` (ISO 8601) and `source` (domain) — see SPEC §8.4.
 * - Self-contained: no database, no hidden imports. `hotels` is an in-memory
 *   data source shaped like the site's Agent View nodes.
 *
 * Run it:  pnpm tsx examples/mcp-server/server.ts   (or `node` after a build)
 * Then an MCP client can connect to http://localhost:3000/mcp.
 */
import express from 'express'
import { z } from 'zod'
import { pathToFileURL } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'

/** Shape of one hotel record — mirrors the site's Agent View content nodes. */
interface Hotel {
  id: string
  name: string
  city: string
  stars: number
  price_mad: number
  url: string
}

// In-memory data source (in production this would be the site's Agent View or
// a database — the tool contract below is what an MCP client sees).
const hotels: Hotel[] = [
  { id: 'h-001', name: 'Four Seasons Casablanca', city: 'Casablanca', stars: 5, price_mad: 3200, url: '/hotels/four-seasons' },
  { id: 'h-002', name: 'Hyatt Regency Casablanca', city: 'Casablanca', stars: 5, price_mad: 2800, url: '/hotels/hyatt-regency' },
  { id: 'h-003', name: 'Sofitel Casablanca Tour Blanche', city: 'Casablanca', stars: 5, price_mad: 2600, url: '/hotels/sofitel-tour-blanche' },
  { id: 'h-004', name: 'Kempinski Hotel Mansour Eddahbi', city: 'Marrakech', stars: 5, price_mad: 2900, url: '/hotels/kempinski' },
  { id: 'h-005', name: 'Boutique Hotel Gaïa', city: 'Marrakech', stars: 4, price_mad: 1400, url: '/hotels/gaia' },
]

// Zod raw shape (SDK v1 API). On the wire, the SDK publishes it as plain JSON
// Schema — the format the MCP protocol defines for `Tool.inputSchema`.
const searchHotelsInput = {
  location: z.string().describe("City name, e.g. 'Casablanca'"),
  stars_min: z.number().int().min(1).max(5).optional().describe('Minimum star rating (1–5)'),
  budget_max_mad: z.number().optional().describe('Maximum price per night in MAD'),
}

/** Registers the search_hotels tool on an MCP server instance. */
function registerTools(server: McpServer): void {
  server.registerTool(
    'search_hotels',
    {
      description:
        'Search available hotels by city. Returns hotels with name, star rating, ' +
        'price in MAD per night, and a booking URL. Filters: stars_min (1–5), ' +
        'budget_max_mad (maximum price per night).',
      inputSchema: searchHotelsInput,
    },
    async (args: { location: string; stars_min?: number; budget_max_mad?: number }) => {
      const found = hotels.filter((h) => {
        if (h.city !== args.location) return false
        if (args.stars_min !== undefined && h.stars < args.stars_min) return false
        if (args.budget_max_mad !== undefined && h.price_mad > args.budget_max_mad) return false
        return true
      })
      return {
        content: [{ type: 'text', text: JSON.stringify(found, null, 2) }],
        structuredContent: { hotels: found, total: found.length },
        isError: false,
        // SPEC §8.4: response _meta MUST carry generated_at (ISO 8601) + source (domain).
        _meta: {
          generated_at: new Date().toISOString(),
          source: 'atlashotels.ma',
          currency: 'MAD',
        },
      }
    },
  )
}

/**
 * Builds the Express app with the /mcp Streamable HTTP endpoint.
 *
 * Stateless mode (no session id): each request is self-contained, which suits
 * a read-only tool server. The SDK v1.30 contract requires a FRESH server +
 * transport per request in stateless mode — `connect()` rejects a second
 * connection on the same instance, and reusing a stateless transport causes
 * message-ID collisions. (Stateful mode instead creates ONE transport with
 * `sessionIdGenerator` and connects the server once.)
 */
export function createMcpApp(): express.Express {
  const app = createMcpExpressApp() // express.json() + localhost DNS-rebinding protection

  app.post('/mcp', async (req, res) => {
    const server = new McpServer({ name: 'atlas-hotels', version: '1.0.0' })
    registerTools(server)
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })

    // Per-request server + transport is the stateless-mode contract, but the
    // instances must be torn down once the response completes — the SDK keeps
    // keep-alive timers alive otherwise. (Cost/benefit discussion:
    // https://github.com/modelcontextprotocol/typescript-sdk/issues/2090.)
    const teardown = () => {
      void transport.close().catch(() => {})
      void server.close().catch(() => {})
    }
    res.on('close', teardown)

    try {
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (err) {
      // handleRequest owns the response once it commits; only fall through for
      // errors raised before that (e.g. a connect failure).
      if (res.headersSent) return
      console.error('MCP request failed:', err)
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal error' },
        id: null,
      })
    }
  })

  return app
}

// Boot only when run directly (`pnpm tsx examples/mcp-server/server.ts`), not
// when imported by tests.
const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const port = Number(process.env.PORT ?? 3000)
  createMcpApp().listen(port, () => {
    console.log(`atlas-hotels MCP server (Streamable HTTP) → http://localhost:${port}/mcp`)
  })
}
