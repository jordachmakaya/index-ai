/**
 * Benchmark corpus generator (SPEC §13.4).
 *
 * The corpus is SYNTHETIC and deterministic: `generateCorpus({ seed })` always
 * produces the same sites. External implementations of index-ai are still "none
 * yet" (SPEC §13.5), so a real-world corpus is impossible — synthetic sites let
 * the benchmark measure the *mechanism* of each conformance level on identical,
 * realistic content. The seed is the dataset version: `results/<date>.json`
 * records which seed produced it, so anyone can regenerate the exact corpus.
 *
 * Site levels and their artifacts (matching SPEC §13.1):
 * - L0   — index.html only
 * - L1   — + .well-known/index-ai.json (+ index-ai.json alias)
 * - L2a  — + agent-index.json (flat, no relations)
 * - L2b  — + agent-index.json (with parent/children relations)
 * - L3   — + agent-index.json (with relations) + a compact query service
 *          (the harness measures the deterministic query shim defined in
 *          benchmark/README.md — the MCP contract of §8)
 *
 * Every site ships 5 queries, one per benchmark query type (identity,
 * freshness, specific fact, listing, cross-reference). Ground-truth answers
 * are substrings that the generator embeds in the content it writes, so
 * citation is verifiable by containment — deterministically.
 */

import { createServer } from 'node:http'

/** Deterministic PRNG (mulberry32). */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CITIES = ['Casablanca', 'Marrakech', 'Rabat', 'Tangier', 'Agadir', 'Fes', 'Meknes', 'Oujda', 'Tetouan', 'El Jadida', 'Essaouira', 'Ifrane']

const AUTHORS = ['S. El Amrani', 'K. Benali', 'N. Idrissi', 'M. Tazi', 'Y. Berrada']

const VERTICALS = {
  hotels: { noun: 'hotel', role: 'official-platform', category: 'hotels', phrase: 'lodging and hospitality', unit: 'MAD', money: true, items: ['Atlas Riad', 'Oasis Suite', 'Marina Villa', 'Palm Penthouse', 'Coral Residence', 'Dune Lodge'], tags: ['booking', 'availability', 'city guides', 'reviews', 'rates', 'loyalty'] },
  blog: { noun: 'article', role: 'blog', category: 'blog', phrase: 'engineering and product writing', unit: 'words', money: false, items: ['Post', 'Guide', 'Review', 'Tutorial', 'Essay', 'Field Notes'], tags: ['rust', 'systems', 'web', 'tooling', 'careers', 'culture'] },
  docs: { noun: 'guide', role: 'official-docs', category: 'documentation', phrase: 'developer documentation', unit: 'pages', money: false, items: ['Setup Guide', 'API Reference', 'CLI Handbook', 'Migration Guide', 'Best Practices', 'FAQ'], tags: ['installation', 'configuration', 'api', 'cli', 'troubleshooting', 'examples'] },
  ecommerce: { noun: 'product', role: 'official-platform', category: 'ecommerce', phrase: 'online retail', unit: 'USD', money: true, items: ['Signature Item', 'Bundle Pack', 'Accessory Set', 'Limited Edition', 'Everyday Kit', 'Pro Series'], tags: ['shipping', 'returns', 'pricing', 'stock', 'reviews', 'bundles'] },
  news: { noun: 'story', role: 'news', category: 'news', phrase: 'journalism and reporting', unit: 'words', money: false, items: ['Report', 'Brief', 'Feature', 'Analysis', 'Interview', 'Explainer'], tags: ['politics', 'economy', 'tech', 'culture', 'sport', 'environment'] },
}

const LEVELS = ['L0', 'L1', 'L2a', 'L2b', 'L3']

function pick(rnd, arr) {
  return arr[Math.floor(rnd() * arr.length)]
}

function int(rnd, min, max) {
  return min + Math.floor(rnd() * (max - min + 1))
}

function titleCase(s) {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase())
}

/**
 * Builds one site. `siteIndex` and `level` fix the RNG seed so the corpus is
 * reproducible from `seed` alone.
 */
function buildSite(seed, siteIndex, level) {
  const rnd = mulberry32((seed ^ (siteIndex * 0x9e3779b9)) >>> 0)
  const verticalKey = Object.keys(VERTICALS)[siteIndex % Object.keys(VERTICALS).length]
  const v = VERTICALS[verticalKey]
  const city = CITIES[siteIndex % CITIES.length]
  const name = `${pick(rnd, v.items)} ${city}`
  const id = `${verticalKey}-${String(siteIndex + 1).padStart(2, '0')}`
  const author = pick(rnd, AUTHORS)
  const tagA = pick(rnd, v.tags)
  const tagB = pick(rnd, v.tags.filter((t) => t !== tagA))
  const itemNames = [0, 1, 2].map((i) => `${pick(rnd, v.items)} ${i + 1}`)
  const prices = itemNames.map(() => int(rnd, 120, 8400))
  const values = itemNames.map((_, i) => (v.money ? `${prices[i]} ${v.unit}` : `${int(rnd, 200, 2400)} ${v.unit}`))
  const dates = itemNames.map(() => `2026-08-${String(int(rnd, 1, 25)).padStart(2, '0')}`)
  const count = int(rnd, 8, 24)

  // Ground-truth answers (substrings embedded in the content below).
  const identityAnswer = `covers ${tagA} and ${tagB}`
  const freshnessAnswer = dates[0]
  const factAnswer = values[0]
  const listingAnswer = `all ${v.noun}s: ${itemNames[0]}, ${itemNames[1]}, ${itemNames[2]}`
  const crossAnswer = `related ${v.noun}s: ${itemNames[0]}, ${itemNames[1]}`

  const description = `${name} ${identityAnswer}, published by ${author}. ${titleCase(v.phrase)} with ${count} ${v.noun}s.`

  // --- clean text content (llm_url endpoints) ---
  const overviewMd = [
    `# ${name}`,
    '',
    description,
    '',
    `## Overview`,
    `${name} is maintained by ${author} and ${identityAnswer}. It was refreshed most recently on ${dates[2]}.`,
    '',
    `## Related`,
    crossAnswer,
    '',
  ].join('\n')

  const catalogMd = [
    `# ${name} catalog`,
    '',
    `${listingAnswer}.`,
    '',
    itemNames
      .map((n, i) => `- ${n} — ${values[i]} (updated ${dates[i]})`)
      .join('\n'),
    '',
    `${count} ${v.noun}s total across the catalog.`,
    '',
  ].join('\n')

  const itemMd = (i) =>
    [
      `---`,
      `title: ${itemNames[i]}`,
      `url: /content/item-${i + 1}.md`,
      `updated: ${dates[i]}`,
      `---`,
      '',
      `# ${itemNames[i]}`,
      '',
      `${itemNames[i]} is one of the ${count} ${v.noun}s on ${name}.`,
      `Current ${v.money ? 'rate' : 'length'}: ${values[i]}.`,
      `Last updated: ${dates[i]}.`,
      '',
      `Full details, terms, and availability are described here in clean text.`,
      '',
    ].join('\n')

  // --- node model (mirrors agent-index.json) ---
  const nodes = [
    {
      id: 'overview',
      type: 'page',
      label: `${name} — overview`,
      description: description,
      summary: `${name}: ${identityAnswer}. Related ${v.noun}s: ${itemNames[0]}, ${itemNames[1]}.`,
      content: overviewMd,
      facts: { coverage: identityAnswer, related: crossAnswer, maintainer: author },
      relations: { parent: null, children: ['catalog', 'item-1', 'item-2', 'item-3'], related: ['item-1', 'item-2'] },
    },
    {
      id: 'catalog',
      type: 'collection',
      label: `${name} catalog`,
      description: `The complete catalog of ${name}.`,
      summary: `${listingAnswer}. ${count} ${v.noun}s total with prices and last-updated dates.`,
      content: catalogMd,
      facts: { listing: listingAnswer, count },
      relations: { parent: 'overview', children: [], related: [] },
    },
    ...[0, 1, 2].map((i, k) => ({
      id: `item-${k + 1}`,
      type: v.noun,
      label: itemNames[k],
      description: `Details on ${itemNames[k]}.`,
      summary: `${itemNames[k]}: features, availability, and current rates in clean text.`,
      content: itemMd(k),
      facts: { price: values[k], updated: dates[k] },
      relations: { parent: 'overview', children: [], related: [] },
    })),
  ]

  // --- artifacts per level ---
  const files = new Map()
  files.set('index.html', { type: 'text/html', body: buildHtml(name, description, identityAnswer, freshnessAnswer, factAnswer, listingAnswer, crossAnswer, v, tagA, tagB) })

  if (level !== 'L0') {
    const manifest = {
      spec_version: '1.0-rc2',
      manifest_version: 1,
      identity: { name, description, domain: `${id}.example.com`, category: [v.category] },
      publisher: { name: `${name} publisher`, role: v.role },
      freshness: { content_updated_at: freshnessAnswer, refresh_frequency: 'monthly' },
      access: { agent_index: `/${id}/agent-index.json` },
    }
    const manifestBody = JSON.stringify(manifest, null, 2)
    files.set('.well-known/index-ai.json', { type: 'application/json', body: manifestBody })
    files.set('index-ai.json', { type: 'application/json', body: manifestBody })
  }

  if (level === 'L2a' || level === 'L2b' || level === 'L3') {
    const viewNodes = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      label: n.label,
      description: n.description,
      content: {
        llm_summary: n.summary,
        llm_url: `/${id}/content/${n.id}.md`,
        content_chars: [...n.content].length,
        content_chars_mode: 'exact',
        summary_method: 'manual',
        language: 'en',
      },
      meta: { facts: n.facts },
      relations: level === 'L2a' ? undefined : n.relations,
    }))
    const view = { generated: '2026-08-12T00:00:00Z', spec_version: '1.0-rc2', total_nodes: nodes.length, nodes: viewNodes }
    files.set('agent-index.json', { type: 'application/json', body: JSON.stringify(view, null, 2) })
    for (const n of nodes) {
      files.set(`content/${n.id}.md`, { type: 'text/markdown', body: n.content })
    }
  }

  const queries = [
    { type: 'identity', q: `Who publishes ${name} and what does it cover?`, answer: identityAnswer },
    { type: 'freshness', q: `When was ${itemNames[0]} last updated?`, answer: freshnessAnswer },
    { type: 'specific-fact', q: `What is the ${v.money ? 'price' : 'length'} of ${itemNames[0]}?`, answer: factAnswer },
    { type: 'listing', q: `List all ${v.noun}s available on ${name}.`, answer: listingAnswer },
    { type: 'cross-reference', q: `Which ${v.noun}s relate to ${name}?`, answer: crossAnswer },
  ]

  return { id, level, vertical: verticalKey, name, domain: `${id}.example.com`, author, nodes, queries, files }
}

/** Realistic HTML with heavy chrome (nav/sidebar/footer/scripts) — the L0 payload. */
function buildHtml(name, description, identityAnswer, freshnessAnswer, factAnswer, listingAnswer, crossAnswer, v, tagA, tagB) {
  const nav = (n) =>
    Array.from({ length: n }, (_, i) => `<li><a href="/${i}">${tagA} ${i + 1}</a></li>`).join('\n')
  const links = (n) =>
    Array.from({ length: n }, (_, i) => `<a href="/x/${i}">${tagB} link ${i + 1}</a>`).join('\n')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name}</title>
<meta name="description" content="${description}">
<style>
:root{--brand:#1a5fb4;--ink:#1c1c1e;--bg:#ffffff;--muted:#6b6b70;--rule:#e2e2e6}
*{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,sans-serif;color:var(--ink);background:var(--bg)}
.site-header{border-bottom:1px solid var(--rule);padding:1rem 1.5rem;display:flex;gap:2rem;align-items:center}
.brand{font-weight:700;color:var(--brand);text-decoration:none}
nav ul{list-style:none;display:flex;gap:1rem;margin:0;padding:0}
.shell{display:grid;grid-template-columns:16rem 1fr;gap:2rem;padding:1.5rem}
.sidebar{font-size:.875rem}.sidebar ul{list-style:none;padding:0;display:grid;gap:.5rem}
.page{max-width:46rem}.page h1{font-size:1.75rem;letter-spacing:-.02em}
.related{border-top:1px solid var(--rule);margin-top:2rem;padding-top:1rem;color:var(--muted)}
footer{border-top:1px solid var(--rule);padding:1.25rem 1.5rem;font-size:.8125rem;color:var(--muted)}
footer a{color:var(--muted);margin-right:.75rem}
</style>
</head>
<body>
<header class="site-header">
<a class="brand" href="/">${name}</a>
<nav aria-label="Primary"><ul>
<li><a href="/">Home</a></li>
${nav(12)}
</ul></nav>
</header>
<div class="shell">
<aside class="sidebar" aria-label="Sidebar"><ul>
${Array.from({ length: 8 }, (_, i) => `<li><a href="/s/${i}">Section ${i + 1}</a></li>`).join('\n')}
</ul></aside>
<main>
<article class="page">
<h1>${name}</h1>
<p>${description}</p>
<section aria-label="Overview">
<h2>Overview</h2>
<p>${name} is a ${v.phrase} site. Its coverage ${identityAnswer}. The catalog lists ${count_note(v, tagB)}.</p>
</section>
<section aria-label="Catalog">
<h2>Catalog</h2>
<p>${listingAnswer}.</p>
<p>Featured item: ${item_line(v)} — ${factAnswer}. Last updated ${freshnessAnswer}.</p>
</section>
<aside class="related">
<h3>Related</h3>
<p>${crossAnswer}.</p>
</aside>
</article>
</main>
</div>
<footer>
${links(15)}
<p>© 2026 ${name} · maintained by ${author_hint()} · updated ${freshnessAnswer}</p>
</footer>
<script>
/* bootstrapping and analytics payload that contributes markup weight */
const t = document.querySelectorAll('a'); window.__links = t.length;
console.assert(t.length > 0, 'nav');
</script>
</body>
</html>`

  function count_note(v, tagB) {
    return `${v.noun}s across ${tagB} categories`
  }
  function item_line(v) {
    return v.noun
  }
  function author_hint() {
    return 'the editorial team'
  }
}

/**
 * @param {{ sitesPerLevel?: number, seed?: number }} [opts]
 * @returns {Array} sites
 */
export function generateCorpus({ sitesPerLevel = 10, seed = 20260812 } = {}) {
  const sites = []
  for (const level of LEVELS) {
    for (let i = 0; i < sitesPerLevel; i += 1) {
      const siteIndex = LEVELS.indexOf(level) * sitesPerLevel + i
      sites.push(buildSite(seed, siteIndex, level))
    }
  }
  return sites
}

/**
 * Serves the corpus over an ephemeral local HTTP server (one origin, each site
 * mounted under `/<siteId>/` with its internal URLs rooted the same way).
 *
 * @param {Array} sites
 * @returns {Promise<{ base: string, close: () => void }>}
 */
export function serveCorpus(sites) {
  const byId = new Map(sites.map((s) => [s.id, s]))
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://benchmark.local')
    const parts = url.pathname.split('/').filter(Boolean)
    const site = byId.get(parts[0])
    if (!site) return end(res, 404)
    const rel = parts.slice(1).join('/') || 'index.html'
    const file = site.files.get(rel)
    if (!file) return end(res, 404)
    res.writeHead(200, { 'content-type': file.type, 'content-length': Buffer.byteLength(file.body) })
    res.end(file.body)
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ base: `http://127.0.0.1:${port}`, close: () => server.close() })
    })
  })
}

function end(res, code) {
  res.writeHead(code)
  res.end()
}
