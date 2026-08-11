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
    <a href="/spec/SPEC-v1.0-rc1">canonical specification</a> — these cards link to the exact sections.
  </p>

  <div class="level-grid">
    <a class="level-card" href="/spec/SPEC-v1.0-rc1#_6-level-1-—-ai-manifest">
      <span class="level-num">1</span>
      <h3>AI Manifest</h3>
      <p><code>/.well-known/index-ai.json</code> — identity, publisher, freshness, policy.</p>
    </a>
    <a class="level-card" href="/spec/SPEC-v1.0-rc1#_7-level-2-—-agent-view">
      <span class="level-num">2a</span>
      <h3>Agent Index</h3>
      <p><code>/agent-index.json</code> — flat list of content nodes, clean text endpoints, measured size.</p>
    </a>
    <a class="level-card" href="/spec/SPEC-v1.0-rc1#_7-level-2-—-agent-view">
      <span class="level-num">2b</span>
      <h3>Agent Graph</h3>
      <p><code>/agent-index.json</code> + relations — navigable graph with typed relationships.</p>
    </a>
    <a class="level-card" href="/spec/SPEC-v1.0-rc1#_8-level-3-—-query-interface">
      <span class="level-num">3</span>
      <h3>Query Interface</h3>
      <p>MCP server — typed API over the Agent View, with rate limiting and traversal caps.</p>
    </a>
  </div>

  <h2 id="read-the-spec">Read the specification</h2>
  <p>
    The complete normative text is maintained as a single source of truth:
    <a href="/spec/SPEC-v1.0-rc1">SPEC-v1.0-rc1.md</a> — terminology, discovery, token economics,
    conformance, security and privacy considerations, governance, and the maturity matrix.
  </p>
</SpecToc>
