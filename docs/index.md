---
layout: page
---

<HeroSection />

<div class="home-section">
  <div class="card">
    <h2>One site, four rungs of conformance</h2>
    <p class="sub">Start at Level 1, climb as far as you need. Partial conformance is valid to ship.</p>

    <ConformanceLadder
      :rungs="[
        { id: '1', title: 'AI Manifest', eta: '~15 minutes', done: true, blurb: 'Identity, publisher, freshness, policy. One HTTP call answers: “What is this site?”', file: '/.well-known/index-ai.json' },
        { id: '2a', title: 'Agent Index', eta: '~1–2 hours, static site', blurb: 'A flat list of content nodes — each with a clean-text endpoint and an exact measured size. An agent can navigate directly, no scraping.', file: '/agent-index.json' },
        { id: '2b', title: 'Agent Graph', eta: '+2–4 hours', blurb: 'Typed relationships between nodes forming a navigable graph. From “hotels” to “hotels-casablanca” to “hotels-casablanca-luxury” — without parsing HTML.', file: '/agent-index.json + relations' },
        { id: '3', title: 'Query Interface', eta: 'MCP', blurb: 'A typed API over the Agent View. The agent sends a query with filters and receives exactly the data requested — minimum possible tokens.', file: 'MCP server' }
      ]"
    />
  </div>
</div>

<div class="home-section">
  <div class="two-grid">
    <div class="panel human">
      <h3>Human visitor</h3>
      <ul>
        <li><b>Needs</b> visual hierarchy, images, interaction</li>
        <li><b>Interface</b> HTML + CSS + JavaScript</li>
        <li><b>Cost</b> bandwidth — cheap</li>
      </ul>
      <p class="panel-quote">The web has spent 30 years optimizing this interface.</p>
    </div>
    <div class="panel agent">
      <h3>LLM agent</h3>
      <ul>
        <li><b>Needs</b> structured facts, relationships, freshness</li>
        <li><b>Interface</b> Agent View — structured, queryable</li>
        <li><b>Cost</b> tokens — expensive</li>
      </ul>
      <p class="panel-quote">index-ai builds the interface the agent side never had.</p>
    </div>
  </div>
</div>
