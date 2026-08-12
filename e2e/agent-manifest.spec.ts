import { test, expect } from '@playwright/test'

// V-001 dogfood: the docs site itself implements index-ai. As a sub-path
// deployment (GitHub Pages /index-ai/), it uses the SPEC §5.2/§5.3 alternative
// discovery: a manifest at an arbitrary URL announced via rel="agent-manifest",
// plus a valid Agent View. Both files are validated against the official
// schemas by the unit suite (tests/schemas-ajv.spec.ts); this test proves they
// are actually served and reachable through the documented discovery chain.

test('site serves its own AI Manifest and Agent View', async ({ page }) => {
  const manifestRes = await page.request.get('/index-ai/.well-known/index-ai.json')
  expect(manifestRes.ok(), 'manifest must be served').toBe(true)
  const manifest = (await manifestRes.json()) as { spec_version: string; identity: { domain: string }; access: { agent_index: string } }
  expect(manifest.spec_version).toBe('1.0-rc2')
  expect(manifest.identity.domain).toBe('jordachmakaya.github.io')
  // The manifest must point at the Agent View actually served below.
  expect(manifest.access.agent_index).toBe('/index-ai/agent-index.json')

  const viewRes = await page.request.get('/index-ai/agent-index.json')
  expect(viewRes.ok(), 'Agent View must be served').toBe(true)
  const view = (await viewRes.json()) as { spec_version: string; total_nodes: number; nodes: unknown[] }
  expect(view.spec_version).toBe('1.0-rc2')
  expect(view.nodes.length).toBeGreaterThan(0)
  expect(view.total_nodes).toBe(view.nodes.length)
  // Every node fetches its content from the IMMUTABLE v1.0-rc2 tag.
  const llmUrls = (view.nodes as Array<{ content: { llm_url: string } }>).map((n) => n.content.llm_url)
  for (const url of llmUrls) {
    expect(url, 'llm_url must reference the immutable v1.0-rc2 tag').toContain('/v1.0-rc2/')
  }
})

test('the §5.2 fallback alias /index-ai.json is served', async ({ page }) => {
  const aliasRes = await page.request.get('/index-ai/index-ai.json')
  expect(aliasRes.ok(), 'fallback alias must be served').toBe(true)
  const alias = (await aliasRes.json()) as { spec_version: string }
  expect(alias.spec_version).toBe('1.0-rc2')
})

test('homepage exposes rel="agent-manifest" discovery', async ({ page }) => {
  await page.goto('/index-ai/')
  const link = page.locator('link[rel="agent-manifest"]')
  await expect(link).toHaveCount(1)
  expect(await link.getAttribute('href')).toBe('/index-ai/.well-known/index-ai.json')
  expect(await link.getAttribute('type')).toBe('application/json')
})
