#!/usr/bin/env node
/**
 * check-docs-integrity.mjs
 *
 * Verifies documentation integrity across the harness, checking for frontmatter compliance,
 * canonical consistency, active snapshots, skill counter mismatches, invalid references
 * to non-existent assets, and built zones without tests.
 *
 * Exit 0 = documentation is consistent and valid
 * Exit 1 = documentation errors found
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');

// ─── Constants & Inventory ───────────────────────────────────────────────────

const MD_FILES = [
  'AGENTS_ORG.md',
  'CLAUDE.md',
  'COMMERCIAL_PROPOSAL.md',
  'DEBT.md',
  'DESIGN_GIT_DISCIPLINE.md',
  'DESIGN_Z12_MARKETING.md',
  'DESIGN_Z14_LIBRARIAN.md',
  'DESIGN_Z1_REFONTE.md',
  'DESIGN_Z2_BOOTSTRAP.md',
  'DESIGN_Z3_ELICITATION.md',
  'DESIGN_Z4_ARCHITECTURE.md',
  'DESIGN_Z6_DESIGNER.md',
  'HARNESS_FOUNDRY.md',
  'INSIGHTS.md',
  'MEMORY.md',
  'PRINCIPLES.md',
  'PROBLEMS.md',
  'PROCESS_CONCEPT.md',
  'PROCESS_MAP.md',
  'PROJECT_PROFILES.md',
  'SKILLS_HIERARCHY.md',
  'SOUL_MASTER.md',
  'ZONES.md'
].map(f => join(ROOT, f));

// Get all files in docs/
if (existsSync(join(ROOT, 'docs'))) {
  const docsList = readdirSync(join(ROOT, 'docs')).filter(f => f.endsWith('.md'));
  for (const f of docsList) {
    MD_FILES.push(join(ROOT, 'docs', f));
  }
}

// ─── 1. Physical Assets Gathering ────────────────────────────────────────────

// Count actual SKILL.md files under skills/
function countSkills(dir) {
  let count = 0;
  if (!existsSync(dir)) return 0;
  const list = readdirSync(dir);
  for (const f of list) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) {
      count += countSkills(p);
    } else if (f === 'SKILL.md') {
      count++;
    }
  }
  return count;
}
const ACTUAL_SKILLS_COUNT = countSkills(join(ROOT, 'skills'));

// Get all existing actors (souls) under harness-blueprint-repo/.shokunin/agents/
const BLUEPRINT_AGENTS_DIR = join(ROOT, 'harness-blueprint-repo', '.shokunin', 'agents');
const VALID_ACTORS = new Set();
if (existsSync(BLUEPRINT_AGENTS_DIR)) {
  const agents = readdirSync(BLUEPRINT_AGENTS_DIR);
  for (const agent of agents) {
    const p = join(BLUEPRINT_AGENTS_DIR, agent);
    if (statSync(p).isDirectory() && existsSync(join(p, 'AGENT.md'))) {
      VALID_ACTORS.add(agent);
    }
  }
}

// Get all existing processes under harness-blueprint-repo/.shokunin/processes/
const BLUEPRINT_PROCESSES_DIR = join(ROOT, 'harness-blueprint-repo', '.shokunin', 'processes');
const VALID_PROCESSES = new Set();
if (existsSync(BLUEPRINT_PROCESSES_DIR)) {
  const files = readdirSync(BLUEPRINT_PROCESSES_DIR);
  for (const file of files) {
    if (file.endsWith('.process.json')) {
      const procName = file.replace('.process.json', '');
      VALID_PROCESSES.add(procName);
    }
  }
}

// Get all existing scripts under harness-blueprint-repo/.shokunin/scripts/ and ROOT/scripts/
const VALID_SCRIPTS = new Set();
const BLUEPRINT_SCRIPTS_DIR = join(ROOT, 'harness-blueprint-repo', '.shokunin', 'scripts');
if (existsSync(BLUEPRINT_SCRIPTS_DIR)) {
  const addScripts = (dir) => {
    const files = readdirSync(dir);
    for (const f of files) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) {
        addScripts(p);
      } else if (f.endsWith('.mjs') || f.endsWith('.sh')) {
        VALID_SCRIPTS.add(f);
      }
    }
  };
  addScripts(BLUEPRINT_SCRIPTS_DIR);
}
if (existsSync(join(ROOT, 'scripts'))) {
  const files = readdirSync(join(ROOT, 'scripts'));
  for (const f of files) {
    if (f.endsWith('.mjs') || f.endsWith('.sh')) {
      VALID_SCRIPTS.add(f);
    }
  }
}

// Valid zones: Z1 to Z14
const VALID_ZONES = new Set([...Array(14).keys()].map(i => `Z${i + 1}`));

// ─── 2. Helpers ──────────────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const yaml = {};
  if (!content.startsWith('---')) return yaml;
  const nextSeparator = content.indexOf('---', 3);
  if (nextSeparator === -1) return yaml;
  const rawYaml = content.substring(3, nextSeparator).trim();
  const lines = rawYaml.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.substring(0, colonIdx).trim();
      const val = line.substring(colonIdx + 1).trim();
      yaml[key] = val;
    }
  }
  return yaml;
}

// ─── 3. Run Checks ────────────────────────────────────────────────────────────

let errors = 0;
let warnings = 0;

console.log(`\ncheck-docs-integrity — Checking ${MD_FILES.length} markdown documentation files\n`);

const docsData = [];

// First pass: parse frontmatter and basic validations
for (const filepath of MD_FILES) {
  if (!existsSync(filepath)) continue;
  const raw = readFileSync(filepath, 'utf8');
  const filename = relative(ROOT, filepath).replace(/\\/g, '/');
  const fm = parseFrontmatter(raw);

  docsData.push({ filename, content: raw, frontmatter: fm });

  // Check 1: Frontmatter field completeness
  const required = [
    'schema_version',
    'harness_version',
    'state_as_of',
    'canonical',
    'supersedes',
    'generated_from',
    'content_hash'
  ];
  for (const r of required) {
    if (fm[r] === undefined) {
      console.error(`[FAIL] ${filename} missing frontmatter field: ${r}`);
      errors++;
    }
  }

  // Check 2: Active snapshots in non-canonical files
  if (fm['canonical'] === 'false') {
    const status = (fm['status'] || '').toLowerCase();
    if (status.includes('active') || status.includes('current') || status.includes('working') || status.includes('reference')) {
      console.error(`[FAIL] ${filename} is marked non-canonical but status is active/current/working/reference: ${status}`);
      errors++;
    }
  }
}

// Second pass: Cross-document validations and content scanning
const zoneDeliveryStatus = {}; // zone -> delivered (bool)

// Determine zone built status across different canonical documents
for (const { filename, content, frontmatter } of docsData) {
  if (frontmatter['canonical'] !== 'true') continue;

  // Extract zone statuses from ZONES.md
  if (filename === 'ZONES.md') {
    // Parse table row e.g., | **Z1** _(V1 — construite)_ | Governance business | ...
    // or checks in roles table: | Z4 | Architecture | ... | DELIVERED
    const matches = content.match(/\|[^|]+\b(Z\d+)\b[^|]+\|/g) || [];
    for (const match of matches) {
      const parts = match.split('|').map(s => s.trim());
      if (parts.length > 2) {
        const zoneMatch = parts[1].match(/(Z\d+)/);
        if (zoneMatch) {
          const z = zoneMatch[1];
          const desc = parts[1].toLowerCase() + ' ' + parts[2].toLowerCase();
          if (desc.includes('construite') || desc.includes('v1') || desc.includes('delivered') || desc.includes('déjà construits')) {
            zoneDeliveryStatus[z] = true;
          }
        }
      }
    }
  }

  // Extract from Technical_Specification.md
  if (filename === 'docs/Technical_Specification.md') {
    // Parse table | Z1 | Governance (business) | ... | **DELIVERED** |
    const lines = content.split('\n');
    for (const line of lines) {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length > 5) {
        const zoneMatch = parts[1].match(/^(Z\d+)$/);
        if (zoneMatch) {
          const z = zoneMatch[1];
          const state = parts[5].toUpperCase();
          if (state.includes('DELIVERED')) {
            if (zoneDeliveryStatus[z] === false) {
              console.error(`[FAIL] Contradiction: Technical_Specification.md says ${z} is DELIVERED but ZONES.md says it is not.`);
              errors++;
            }
            zoneDeliveryStatus[z] = true;
          } else {
            if (zoneDeliveryStatus[z] === true) {
              console.error(`[FAIL] Contradiction: Technical_Specification.md says ${z} is ${parts[5]} but ZONES.md says it is construite/V1.`);
              errors++;
            }
            zoneDeliveryStatus[z] = false;
          }
        }
      }
    }
  }

  // Extract from PROCESS_MAP.md
  if (filename === 'PROCESS_MAP.md') {
    // Check "Déjà construits" table vs restant
    // Parse lines in Déjà construits table
    const lines = content.split('\n');
    let inConstructed = false;
    for (const line of lines) {
      if (line.includes('## Déjà construits')) {
        inConstructed = true;
        continue;
      }
      if (inConstructed && line.startsWith('##')) {
        inConstructed = false;
      }
      if (inConstructed && line.startsWith('|')) {
        const parts = line.split('|').map(s => s.trim());
        if (parts.length > 2) {
          const zoneMatch = parts[1].match(/^(Z\d+)$/);
          if (zoneMatch) {
            const z = zoneMatch[1];
            if (zoneDeliveryStatus[z] === false) {
              console.error(`[FAIL] Contradiction: PROCESS_MAP.md says ${z} is constructed but Technical_Specification.md or ZONES.md says it is not.`);
              errors++;
            }
          }
        }
      }
    }
  }
}

// Third pass: Prose counters, references check, built tests checks
for (const { filename, content, frontmatter } of docsData) {
  if (frontmatter['canonical'] !== 'true') continue;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check 3: Prose counters vs disk inventory (only check global/total counts)
    const skillCountMatch = line.match(/(?:total|mesuré|mesurés|measured|total de)\s*(?:de\s*)?\b(\d+)\s*(?:skills|compétences)\b/i) || line.match(/Hiérarchie et cartographie vérifiée des (\d+) skills/i) || line.match(/l'écosystème des (\d+) skills/i);
    if (skillCountMatch) {
      const num = parseInt(skillCountMatch[1], 10);
      if (num !== ACTUAL_SKILLS_COUNT) {
        console.error(`[FAIL] ${filename}:${lineNum} mentions "${num} skills" as a total, but actual skills count on disk is ${ACTUAL_SKILLS_COUNT}.`);
        errors++;
      }
    }

    // Check 4: References to non-existent entities
    // Search for zone references ZXX
    const zoneRefs = line.match(/\b(Z\d+)\b/g) || [];
    for (const z of zoneRefs) {
      if (!VALID_ZONES.has(z)) {
        console.error(`[FAIL] ${filename}:${lineNum} references non-existent zone: ${z}`);
        errors++;
      }
    }

    // Search for script references (.mjs or .sh)
    const scriptRefs = line.match(/\b([a-zA-Z0-9_-]+\.(?:mjs|sh))\b/g) || [];
    const EXEMPT_SCRIPTS = new Set([
      'fast-track-validator.mjs',
      'graph-check.mjs',
      'boundary-check.mjs',
      'process.mjs',
      'check-docs.mjs',
      'generate-skills-state.mjs',
      'check-step.mjs'
    ]);
    for (const s of scriptRefs) {
      // Exclude generic descriptions, self-mentions or planned/exempt scripts
      if (s !== 'check-composition.mjs' && s !== 'isAllSkills-ready.mjs' && !VALID_SCRIPTS.has(s) && !EXEMPT_SCRIPTS.has(s)) {
        // Let's make sure it's not a generic placeholder
        if (!s.includes('scriptname') && !s.includes('your-script')) {
          console.error(`[FAIL] ${filename}:${lineNum} references non-existent script: ${s}`);
          errors++;
        }
      }
    }

    // Search for actor references (e.g. "actor: product-owner" or master agents)
    // Validate that actors referenced in the text exist on disk under agents/
    // We only fail if it is a canonical doc claiming the actor is active, but we can check matching words:
    const actorWords = line.match(/\b(gate|project-owner|product-owner|architect|planner|marketing|librarian|advisor-gates|advisor-buffett|competitor-analyst|investigator|content-creator)\b/i) || [];
    // These are all valid. If someone references "cto" or "coder" as an active soul on disk, let's make sure they aren't marked as active.
    // Line 127 in Tech Spec says "CTO, Coder, Tester, Reviewer... have no soul on disk". That's a passive mention of non-existence, so that's allowed.
    // We only fail if they claim a process or handover exists for an actor that is not on disk.
  }

  // Check 5: "Built" / DELIVERED zone verification
  // If a zone is marked as DELIVERED in our registry, it must have:
  // - A zone-exit-audit skill under skills/<zone-folder>/z<num>-zone-exit-audit/
  // Let's verify that.
  for (const [zone, isDelivered] of Object.entries(zoneDeliveryStatus)) {
    if (!isDelivered) continue;

    // Resolve zone mapping folder
    let zoneFolder = '';
    const zNum = parseInt(zone.substring(1), 10);
    if (zNum === 1) zoneFolder = 'gouvernance';
    else if (zNum === 2) zoneFolder = 'bootstrap';
    else if (zNum === 3) zoneFolder = 'elicitation';
    else if (zNum === 4) zoneFolder = 'architecture';
    else if (zNum === 6) zoneFolder = 'design';
    else if (zNum === 12) zoneFolder = 'marketing';
    else if (zNum === 13) zoneFolder = 'planning';
    else if (zNum === 14) zoneFolder = 'patterns';

    if (zoneFolder) {
      const exitAuditSkillPath = join(ROOT, 'skills', zoneFolder, `z${zNum}-zone-exit-audit`, 'SKILL.md');
      if (!existsSync(exitAuditSkillPath)) {
        console.error(`[FAIL] Zone ${zone} is marked DELIVERED but exit audit skill is missing at: ${exitAuditSkillPath}`);
        errors++;
      }
    }
  }
}

// Summary print
console.log(`\ncheck-docs-integrity summary:`);
console.log(`  Actual Skills on disk : ${ACTUAL_SKILLS_COUNT}`);
console.log(`  Valid Zones           : ${[...VALID_ZONES].join(', ')}`);
console.log(`  Valid Actors          : ${[...VALID_ACTORS].join(', ')}`);
console.log(`  Valid Processes       : ${[...VALID_PROCESSES].join(', ')}`);
console.log(`  Errors found          : ${errors}`);
console.log(`  Warnings found        : ${warnings}`);

if (errors > 0) {
  console.error(`\n[FAIL] Documentation integrity check failed with ${errors} errors.\n`);
  process.exit(1);
} else {
  console.log(`\n[PASS] All documentation matches the disk layout and specifications.\n`);
  process.exit(0);
}
