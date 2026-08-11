#!/usr/bin/env node
/**
 * check-composition.mjs
 *
 * The executable gate for PR-8 — "a zone is a function: artifacts -> artifacts".
 *
 * A principle without a check does not exist (PR-2). This script turns three of
 * PR-8's five properties into exit codes, by reading the blueprint's
 * `.process.json` files as a set of function signatures:
 *
 *   1. SIGNATURE   every process declares a zone; every step declares a check.
 *   2. COMPOSITION every declared input has a producer somewhere in the graph.
 *                  A missing producer means the next zone is called with an
 *                  undefined argument and halts — the pipeline is broken, and
 *                  the gate reports it rather than causing it.
 *   3. OWNERSHIP   a write into another zone's territory is legal only when the
 *                  step invokes an actor-gated command. Ownership is per FIELD,
 *                  never per file; the actor gate IS the ownership. A gated mode
 *                  that no process calls gates nothing.
 *
 * The remaining two properties (isolated body, declaring an input you never
 * read) are not mechanisable from the JSON alone and stay review rules.
 *
 * This is a FOUNDRY script, not a blueprint script: it validates the harness's
 * own design, not the runtime state of a born project. It therefore needs no
 * witness scaffold and reads the blueprint in place.
 *
 * Exit 0 = composition sound
 * Exit 1 = one or more errors
 *
 * Usage:
 *   node scripts/check-composition.mjs
 *   node scripts/check-composition.mjs --strict           # warnings -> errors
 *   node scripts/check-composition.mjs --json             # machine-readable
 *   node scripts/check-composition.mjs --processes <dir>  # audit another tree
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

// ─── Config ───────────────────────────────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');

const STRICT = process.argv.includes('--strict');
const AS_JSON = process.argv.includes('--json');

/** `--processes <dir>` lets the test harness point at a mutated copy, so the
 *  gate can be proven to BITE before it is trusted to pass. */
function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const PROCESS_DIR =
  argValue('--processes') ?? join(ROOT, 'harness-blueprint-repo', '.shokunin', 'processes');

/** Zone territory — the single source for ownership. An entry matches by string
 *  prefix, or by RegExp when the boundary falls inside a templated path.
 *
 *  Order matters: the FIRST match wins, so narrow rules precede broad ones
 *  (`brief/BUSINESS_` is Z1's, while the rest of `brief/` is Z3's).
 *
 *  Derived from ZONES.md "Documents par zone", which is the build spec. Note
 *  `upgrades/`: it is NOT a homogeneous territory — Z2 owns the intake
 *  (`REQUEST.md`, `inbox/`), Z1 owns the verdict and the investigation. Reading
 *  it as one block produced three false positives on the first run, which is
 *  precisely the failure mode a coarse instrument creates. */
const TERRITORY = [
  [/upgrades\/[^/]*\/(UPGRADE_ACCEPTED|UPGRADE_REJECTED|investigation)/, 'gouvernance'],
  [/upgrades\/[^/]*\/REQUIREMENTS_DELTA/, 'elicitation'],
  [/upgrades\/[^/]*\/ARCHITECTURE_DELTA/, 'architecture'],
  ['.shokunin/business/debates/',       'shared:debates'],
  ['.shokunin/business/',               'gouvernance'],
  ['.shokunin/features.json',           'gouvernance'],
  ['.shokunin/features/',               'gouvernance'],
  ['.shokunin/brief/BUSINESS_',         'gouvernance'],
  ['.shokunin/brief/DESIGN_TOKENS',     'design'],
  ['.shokunin/brief/USER_JOURNEY_FINAL', 'design'],
  ['.shokunin/design/',                 'design'],
  ['.shokunin/brief/requirements.json', 'elicitation'],
  ['.shokunin/brief/ARCHITECTURE',      'architecture'],
  ['.shokunin/brief/SCHEMA',            'architecture'],
  ['.shokunin/brief/DEPLOYMENT',        'architecture'],
  ['.shokunin/brief/TECHNICAL_SURFACES', 'architecture'],
  ['.shokunin/brief/INTERACTIONS',      'architecture'],
  ['.shokunin/brief/QUALITY_PLAN',      'architecture'],
  ['.shokunin/brief/openapi',           'shared:openapi'],
  ['.shokunin/brief/decisions/',        'architecture'],
  ['.shokunin/brief/',                  'elicitation'],
  ['.shokunin/planning/',               'planning'],
  ['.shokunin/jobs/',                   'planning'],
  ['.shokunin/marketing/',              'marketing'],
  ['.shokunin/traceability/',           'execution'],
  ['.shokunin/acceptance/',             'execution'],
  ['.shokunin/bug-memory/',             'execution'],
  ['.shokunin/security/',               'securite'],
  ['.shokunin/release/',                'release-ops'],
  ['.shokunin/ship/',                   'release-ops'],
  ['.shokunin/incidents/',              'release-ops'],
  ['.shokunin/PROJECT_STATUS.md',       'bootstrap'],
  ['.shokunin/harness.config.json',     'bootstrap'],
  ['.shokunin/dashboard/',              'bootstrap'],
  ['.shokunin/tmp/',                    'bootstrap'],
  ['.shokunin/upgrades/',               'bootstrap'],
];

/** Paths exempt from needing a producer: shipped with the blueprint, or dropped
 *  by the human. They are constants of the system, not return values. */
const NO_PRODUCER_NEEDED = [
  '.shokunin/templates/',
  '.shokunin/rules/',
  '.shokunin/agents/',
  '.shokunin/scripts/',
  'code-snippets/',
];

/** `business/debates/` is written by three zones. That is not per-field
 *  ownership — there is no field, there is a directory. It is a shared
 *  namespace, a category PR-8 does not define. Reported as a warning under its
 *  own label so it is never silently folded into the legal case. */
const SHARED_NAMESPACE = 'shared:debates';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const territoryOf = (p) =>
  TERRITORY.find(([rule]) => (rule instanceof RegExp ? rule.test(p) : p.startsWith(rule)))?.[1] ?? null;
const needsProducer = (p) => !NO_PRODUCER_NEEDED.some((pre) => p.startsWith(pre));

/** A step is actor-gated when it invokes a command carrying `--actor`, in either
 *  its instruction or its check. Prose claiming exclusivity is not a gate. */
const isActorGated = (step) =>
  ['instruction', 'check'].some((k) => typeof step[k] === 'string' && step[k].includes('--actor'));

function loadProcesses(dir) {
  if (!existsSync(dir)) {
    console.error(`[ERROR] no process directory at ${dir}`);
    process.exit(1);
  }
  return readdirSync(dir)
    .filter((f) => f.endsWith('.process.json'))
    .map((f) => {
      const raw = readFileSync(join(dir, f), 'utf8');
      try {
        return { file: f, doc: JSON.parse(raw) };
      } catch (e) {
        console.error(`[ERROR] ${f} is not valid JSON — ${e.message}`);
        process.exit(1);
      }
    });
}

// ─── Checks ───────────────────────────────────────────────────────────────────

function analyse(processes) {
  const findings = [];
  const add = (level, rule, file, step, message) =>
    findings.push({ level, rule, file, step, message });

  // Every output produced anywhere, and by whom.
  const producers = new Map(); // path -> [{file, zone}]
  for (const { file, doc } of processes) {
    for (const step of doc.steps ?? []) {
      for (const out of step.outputs ?? []) {
        if (!producers.has(out)) producers.set(out, []);
        producers.get(out).push({ file, zone: doc.zone });
      }
    }
  }

  for (const { file, doc } of processes) {
    // 1. SIGNATURE
    if (!doc.zone) add('error', 'signature', file, null, 'process declares no `zone`');

    for (const step of doc.steps ?? []) {
      const id = step.id ?? '(no id)';
      if (!step.check) {
        add('error', 'signature', file, id, 'step has no `check` — a rule without a gate does not exist (PR-2)');
      }

      // 2. COMPOSITION
      for (const input of step.inputs ?? []) {
        if (!needsProducer(input)) continue;
        if (producers.has(input)) continue;
        add('error', 'composition', file, id,
          `declared input has no producer anywhere: ${input}` +
          (territoryOf(input) ? ` (territory: ${territoryOf(input)})` : ''));
      }

      // 3. OWNERSHIP
      for (const out of step.outputs ?? []) {
        const territory = territoryOf(out);
        if (!territory || territory === doc.zone) continue;

        if (territory.startsWith('shared:')) {
          add('warn', 'shared-namespace', file, id,
            `writes into a namespace owned by no single zone: ${out} — not per-field ownership (DEBT-013)`);
          continue;
        }
        if (!isActorGated(step)) {
          add('error', 'ownership', file, id,
            `zone '${doc.zone}' writes into territory '${territory}' with no actor-gated command: ${out}`);
        }
      }
    }
  }

  return findings;
}

// ─── Report ───────────────────────────────────────────────────────────────────

function report(findings, processes) {
  const errors = findings.filter((f) => f.level === 'error');
  const warns  = findings.filter((f) => f.level === 'warn');

  console.log(`\ncheck-composition — ${processes.length} process files, ${basename(PROCESS_DIR)}/\n`);

  for (const rule of ['signature', 'composition', 'ownership', 'shared-namespace']) {
    const hits = findings.filter((f) => f.rule === rule);
    if (hits.length === 0) {
      console.log(`  [PASS] ${rule}`);
      continue;
    }
    console.log(`  [${hits.some((h) => h.level === 'error') ? 'FAIL' : 'WARN'}] ${rule}`);
    for (const h of hits) console.log(`         ${h.file} ${h.step ?? ''} — ${h.message}`);
  }

  console.log(`\n  ${errors.length} error(s) · ${warns.length} warning(s)\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const processes = loadProcesses(PROCESS_DIR);
const findings = analyse(processes);

if (AS_JSON) {
  console.log(JSON.stringify({ processes: processes.length, findings }, null, 2));
} else {
  report(findings, processes);
}

const failed = findings.some((f) => f.level === 'error' || (STRICT && f.level === 'warn'));
process.exit(failed ? 1 : 0);
