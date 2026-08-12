---
layout: page
---

<script setup>
import SpecToc from '../.vitepress/theme/components/SpecToc.vue'
</script>

<SpecToc>
  <h2 id="levels">Conformance levels</h2>
  <p>
    The standard is organized in three progressive levels. Level 2a and 2b share the same file;
    2b extends 2a with optional relation fields. The full normative text lives in the
    <a href="./SPEC-v1.0-rc1">canonical specification</a> — these cards link to the exact sections.
  </p>

  <div class="level-ladder">
    <a class="lvl" href="./SPEC-v1.0-rc1#_6-level-1-—-ai-manifest">
      <span class="lvl-num" aria-hidden="true">1</span>
      <span class="lvl-body">
        <span class="lvl-title">AI Manifest</span>
        <span class="lvl-blurb">Identity, publisher, freshness, policy — one HTTP call answers: “What is this site?”</span>
        <span class="lvl-file">/.well-known/index-ai.json</span>
      </span>
      <span class="lvl-go" aria-hidden="true">→</span>
    </a>
    <a class="lvl" href="./SPEC-v1.0-rc1#_7-level-2-—-agent-view">
      <span class="lvl-num" aria-hidden="true">2a</span>
      <span class="lvl-body">
        <span class="lvl-title">Agent Index</span>
        <span class="lvl-blurb">A flat list of content nodes — each with a clean-text endpoint and an exact measured size.</span>
        <span class="lvl-file">/agent-index.json</span>
      </span>
      <span class="lvl-go" aria-hidden="true">→</span>
    </a>
    <a class="lvl" href="./SPEC-v1.0-rc1#_7-level-2-—-agent-view">
      <span class="lvl-num" aria-hidden="true">2b</span>
      <span class="lvl-body">
        <span class="lvl-title">Agent Graph</span>
        <span class="lvl-blurb">Typed relationships between nodes — from “hotels” to “hotels-casablanca-luxury”, without parsing HTML.</span>
        <span class="lvl-file">/agent-index.json + relations</span>
      </span>
      <span class="lvl-go" aria-hidden="true">→</span>
    </a>
    <a class="lvl" href="./SPEC-v1.0-rc1#_8-level-3-—-query-interface">
      <span class="lvl-num" aria-hidden="true">3</span>
      <span class="lvl-body">
        <span class="lvl-title">Query Interface</span>
        <span class="lvl-blurb">A typed API over the Agent View — the agent sends a query with filters and receives exactly the data requested.</span>
        <span class="lvl-file">MCP server</span>
      </span>
      <span class="lvl-go" aria-hidden="true">→</span>
    </a>
  </div>

  <h2 id="read-the-spec">Read the specification</h2>
  <div class="spec-cta">
    <a class="btn-spec" href="./SPEC-v1.0-rc1">Open SPEC-v1.0-rc1 <span aria-hidden="true">→</span></a>
    <p>Terminology · discovery · token economics · conformance · security · privacy · compatibility · governance — the canonical text, versioned.</p>
  </div>
</SpecToc>
