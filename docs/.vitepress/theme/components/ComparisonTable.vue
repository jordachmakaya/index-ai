<script setup lang="ts">
// v4 ComparisonTable (V-004): the validated `cmp-t` comparison table (Phase B
// reference pages/comparison.html) rebuilt on the v4 token system. Semantic
// <table> — same facts as the markdown pipe table it replaces, with the designed
// hierarchy: mono row labels, bold headline + muted detail per cell, and the
// index-ai column visually anchored (verification semantics, green ≤5 %).
type Cell = { b: string; s: string }
type Row = { label: string; ia: Cell; lt: Cell }

const rows: Row[] = [
  {
    label: 'What it is',
    ia: { b: 'A structured, verifiable standard', s: 'Machine-readable JSON schema, validated by a reference validator' },
    lt: { b: 'A human-readable text file', s: 'Markdown text with links, suggested by a blog post' },
  },
  {
    label: 'Format',
    // Note: backticks stripped — this component renders plain text, the old
    // markdown pipe table rendered them as <code>. Paths read fine as text.
    ia: { b: 'Valid JSON', s: '/.well-known/index-ai.json + /agent-index.json, both schema-validated' },
    lt: { b: 'Plain text / Markdown', s: '/llms.txt, no schema, no validation, no structure contract' },
  },
  {
    label: 'Verification',
    ia: { b: 'Measured and checked', s: 'content_chars is an exact NFC code point count verified against the served content; conformance is graded by a validator' },
    lt: { b: 'Declared, never verified', s: 'nothing in the file is checked against the actual site content' },
  },
  {
    label: 'Budget signal',
    ia: { b: 'Known before fetch', s: 'every node declares its exact content size; the agent budgets tokens before fetching' },
    lt: { b: 'Unknown until fetched', s: 'an agent must fetch each linked page to learn its size' },
  },
  {
    label: 'Structure',
    ia: { b: 'Nodes + optional graph', s: 'typed relationships (2b) let agents traverse without parsing HTML' },
    lt: { b: 'Flat list of links', s: 'sections and links, no data model, no relationships' },
  },
  {
    label: 'Query interface',
    ia: { b: 'Level 3 (MCP)', s: 'an optional typed API over the Agent View' },
    lt: { b: 'None', s: 'a text file, no query interface exists or could' },
  },
  {
    label: 'Policy',
    ia: { b: 'Machine-readable', s: 'policy.usage_preferences declares search/summarization/citation preferences' },
    lt: { b: 'Absent', s: 'no machine-readable usage or citation policy' },
  },
]
</script>

<template>
  <div class="cmp-wrap">
    <table class="cmp-t">
      <thead>
        <tr>
          <th class="dim" scope="col" aria-label="Criterion"></th>
          <th class="ia" scope="col">index-ai</th>
          <th class="lt" scope="col">llms.txt</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rows" :key="r.label">
          <th class="row-label" scope="row">{{ r.label }}</th>
          <td class="cell ia-cell"><b>{{ r.ia.b }}</b><span>{{ r.ia.s }}</span></td>
          <td class="cell"><b>{{ r.lt.b }}</b><span>{{ r.lt.s }}</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.cmp-wrap {
  overflow-x: auto;
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
}
.cmp-t {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  min-width: 34rem;
}
.cmp-t th,
.cmp-t td {
  text-align: left;
  vertical-align: top;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--vp-c-border);
}
.cmp-t tr:last-child th,
.cmp-t tr:last-child td {
  border-bottom: none;
}
.cmp-t thead th {
  font-family: var(--vp-font-family-mono);
  font-size: 0.78125rem;
  letter-spacing: 0.02em;
  padding-top: 0.875rem;
  padding-bottom: 0.875rem;
  border-bottom: 1px solid var(--vp-c-border);
}
.cmp-t .dim {
  width: 8.5rem;
}
.cmp-t thead .ia {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-tint);
}
.cmp-t thead .lt {
  color: var(--vp-c-text-3);
}
.row-label {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}
.cell b {
  display: block;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 0.25rem;
}
.cell span {
  display: block;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}
</style>
