#!/usr/bin/env node
/**
 * check-zones-compliance.mjs
 *
 * Validation script that checks all DELIVERED zones in the Shokunin harness for technical compliance
 * against ZONES_COMPLIANCE.md.
 *
 * Exit 0 = all active zones are fully compliant
 * Exit 1 = compliance violations found
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');

// ─── 1. Identify Delivered Zones ─────────────────────────────────────────────

const techSpecPath = join(ROOT, 'docs', 'Technical_Specification.md');
if (!existsSync(techSpecPath)) {
  console.error(`[ERROR] Technical Specification missing at: ${techSpecPath}`);
  process.exit(1);
}

const specLines = readFileSync(techSpecPath, 'utf8').split('\n');
const deliveredZones = new Set();

for (const line of specLines) {
  const parts = line.split('|').map(s => s.trim());
  if (parts.length > 5) {
    const zoneMatch = parts[1].match(/^(Z\d+)$/);
    if (zoneMatch) {
      const z = zoneMatch[1];
      const state = parts[5].toUpperCase();
      if (state.includes('DELIVERED') && !state.includes('NOT')) {
        deliveredZones.add(z);
      }
    }
  }
}

console.log(`\ncheck-zones-compliance — Auditing ${deliveredZones.size} DELIVERED zones: ${[...deliveredZones].join(', ')}\n`);

// ─── 2. Zone Folder Mappings ──────────────────────────────────────────────────

const ZONE_FOLDERS = {
  Z1: { folder: 'gouvernance', actor: 'project-owner', handoff: 'gouvernance' },
  Z2: { folder: 'bootstrap', actor: 'gate', handoff: 'bootstrap' },
  Z3: { folder: 'elicitation', actor: 'product-owner', handoff: 'elicitation' },
  Z4: { folder: 'architecture', actor: 'architect', handoff: 'architecture' },
  Z5: { folder: 'execution', actor: 'cto', handoff: 'execution' },
  Z6: { folder: 'design', actor: 'design-owner', handoff: 'design' },
  Z8: { folder: 'securite', actor: 'security', handoff: 'securite' },
  Z9: { folder: 'release-ops', actor: 'ops', handoff: 'release-ops' },
  Z10: { folder: 'continuite', actor: null, handoff: null }, // Middleware
  Z12: { folder: 'marketing', actor: 'marketing', handoff: 'marketing' },
  Z13: { folder: 'planning', actor: 'planner', handoff: 'planning' },
  Z14: { folder: 'patterns', actor: 'librarian', handoff: 'patterns' }
};

// ─── 3. Run Checks ────────────────────────────────────────────────────────────

let errors = 0;

// Read all process files
const BLUEPRINT_PROCESSES_DIR = join(ROOT, 'harness-blueprint-repo', '.shokunin', 'processes');
const processesByZone = {}; // zone (lowercase) -> array of process details

if (existsSync(BLUEPRINT_PROCESSES_DIR)) {
  const files = readdirSync(BLUEPRINT_PROCESSES_DIR).filter(f => f.endsWith('.process.json'));
  for (const file of files) {
    const p = join(BLUEPRINT_PROCESSES_DIR, file);
    try {
      const data = JSON.parse(readFileSync(p, 'utf8'));
      const z = (data.zone || '').toLowerCase();
      if (!processesByZone[z]) processesByZone[z] = [];
      processesByZone[z].push({ file, data });
    } catch (err) {
      console.error(`[FAIL] Failed to parse process JSON: ${file}`, err.message);
      errors++;
    }
  }
}

// Check handoff transition mappings in handoff.mjs
const handoffMjsPath = join(ROOT, 'harness-blueprint-repo', '.shokunin', 'scripts', 'handoff.mjs');
let handoffContent = '';
if (existsSync(handoffMjsPath)) {
  handoffContent = readFileSync(handoffMjsPath, 'utf8');
}

for (const zone of deliveredZones) {
  const config = ZONE_FOLDERS[zone];
  if (!config) {
    console.error(`[FAIL] Zone ${zone} is DELIVERED but lacks compliance mapping configuration in linter.`);
    errors++;
    continue;
  }

  console.log(`Auditing Zone ${zone} (${config.folder})...`);

  // Requirement 1: Handoff Folder Presence
  if (config.handoff) {
    const handoffPath = join(ROOT, 'harness-blueprint-repo', '.shokunin', 'handoffs', config.handoff);
    if (!existsSync(handoffPath)) {
      console.error(`  [FAIL] Missing handoff directory: ${handoffPath}`);
      errors++;
    } else {
      console.log(`  [PASS] Handoff directory exists: ${config.handoff}/`);
    }
  }

  // Requirement 2: Master Agent AGENT.md Profile (exempting Z10)
  if (config.actor) {
    const agentPath = join(ROOT, 'harness-blueprint-repo', '.shokunin', 'agents', config.actor, 'AGENT.md');
    if (!existsSync(agentPath)) {
      console.error(`  [FAIL] Master Agent AGENT.md profile missing: ${agentPath}`);
      errors++;
    } else {
      console.log(`  [PASS] AGENT.md profile exists for actor: ${config.actor}`);
      
      // Verify AGENT.md has write-list
      const agentRaw = readFileSync(agentPath, 'utf8');
      if (!agentRaw.toLowerCase().includes('write-list')) {
        console.error(`  [FAIL] AGENT.md profile for ${config.actor} is missing a write-list specification.`);
        errors++;
      }
    }
  }

  // Requirement 3: Exit Audit Skill (exempting Z10)
  if (config.actor) {
    const zNum = parseInt(zone.substring(1), 10);
    const exitAuditPath = join(ROOT, 'skills', config.folder, `z${zNum}-zone-exit-audit`, 'SKILL.md');
    if (!existsSync(exitAuditPath)) {
      console.error(`  [FAIL] Exit audit skill missing: ${exitAuditPath}`);
      errors++;
    } else {
      console.log(`  [PASS] Exit audit skill exists: z${zNum}-zone-exit-audit`);
    }
  }

  // Requirement 4: Process Files & Z10 Open/Close Câblage
  // Resolve standard zone key (processes identify zone via data.zone)
  const zoneKey = config.folder.toLowerCase() === 'gouvernance' ? 'gouvernance' : config.folder.toLowerCase();
  const zoneProcesses = processesByZone[zoneKey] || [];
  
  if (zoneProcesses.length === 0 && zone !== 'Z10') {
    console.error(`  [FAIL] No process definition file found on disk for zone: ${zoneKey}`);
    errors++;
  } else {
    for (const { file, data } of zoneProcesses) {
      const steps = data.steps || [];
      if (steps.length < 2) {
        console.error(`  [FAIL] Process file ${file} has fewer than 2 steps, cannot support session lifecycle.`);
        errors++;
        continue;
      }

      // Verify step SO (Session Open)
      const firstStep = steps[0];
      if (firstStep.id !== 'SO' || firstStep.action !== 'session-open') {
        console.error(`  [FAIL] Process file ${file} first step is not SO (session-open).`);
        errors++;
      } else {
        const expectedCheck = `--open --zone ${zoneKey}`;
        if (!firstStep.check.includes(expectedCheck)) {
          console.error(`  [FAIL] Process file ${file} step SO check does not verify correct zone. Expected containing: "${expectedCheck}", got: "${firstStep.check}"`);
          errors++;
        } else {
          console.log(`  [PASS] Process ${file} first step correctly initializes Z10 session`);
        }
      }

      // Verify step SC (Session Close)
      const lastStep = steps[steps.length - 1];
      if (lastStep.id !== 'SC' || lastStep.action !== 'session-close') {
        console.error(`  [FAIL] Process file ${file} last step is not SC (session-close).`);
        errors++;
      } else {
        const expectedCheck = `--close --zone ${zoneKey}`;
        if (!lastStep.check.includes(expectedCheck)) {
          console.error(`  [FAIL] Process file ${file} step SC check does not verify correct zone. Expected containing: "${expectedCheck}", got: "${lastStep.check}"`);
          errors++;
        } else {
          console.log(`  [PASS] Process ${file} last step correctly closes Z10 session`);
        }
      }
    }
  }

  // Requirement 5: Transition and handoff mapping
  if (config.actor && handoffContent) {
    if (!handoffContent.includes(config.actor) && !handoffContent.includes(config.folder)) {
      console.error(`  [FAIL] Zone ${zone} / Actor ${config.actor} is not referenced in handoff.mjs transitions.`);
      errors++;
    } else {
      console.log(`  [PASS] Zone transition mapping verified in handoff.mjs`);
    }
  }
}

console.log(`\ncheck-zones-compliance summary:`);
console.log(`  Delivered zones audited: ${deliveredZones.size}`);
console.log(`  Compliance errors found : ${errors}`);

if (errors > 0) {
  console.error(`\n[FAIL] Zone compliance verification failed with ${errors} errors.\n`);
  process.exit(1);
} else {
  console.log(`\n[PASS] All active zones satisfy the Shokunin V1 compliance criteria.\n`);
  process.exit(0);
}
