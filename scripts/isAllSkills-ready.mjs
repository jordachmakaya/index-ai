#!/usr/bin/env node
/**
 * isAllSkills-ready.mjs
 *
 * Walks skills/ recursively, finds every SKILL.md, validates structure.
 *
 * Exit 0 = all skills valid
 * Exit 1 = one or more skills have errors
 *
 * Usage:
 *   node scripts/isAllSkills-ready.mjs
 *   node scripts/isAllSkills-ready.mjs --strict   # warnings -> errors
 *   node scripts/isAllSkills-ready.mjs --json      # machine-readable
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

// ─── Config ───────────────────────────────────────────────────────────────────

const __dir  = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dir, '..');

/** Skill trees to validate.
 *
 *  This script belongs to the HARNESS, not to the repo root: `ROOT` above is
 *  `shokunin-harness/`. Everything the harness validates lives inside the
 *  harness, so the harness stays self-contained and movable.
 *
 *  V0 (`coding-skills/`, at the repo root) is deliberately unreachable from
 *  here. It is temporary and being discarded: linting it would let a tree we are
 *  throwing away fail CI and block V1 work. V0 is not to be improved, only
 *  removed — and this script cannot even see it.
 *
 *  A root absent from disk is skipped. */
const SKILL_ROOTS = [
  join(ROOT, 'skills'), // the V1 skill tree
];

/** @type {string[]} roots actually present on disk */
const ACTIVE_ROOTS = SKILL_ROOTS.filter((r) => existsSync(r));

const STRICT      = process.argv.includes('--strict');
const JSON_OUTPUT = process.argv.includes('--json');

/** Stale output paths that should now be .shokunin/
 *  Note: `docs/` was removed here on 2026-07-02 — it is now the canonical VitePress
 *  site output (docs-publisher / generate-docs.mjs, PATHS_REGISTRY §3), a legitimate
 *  non-.shokunin path like src/ or LOGIC.md. The old rule predated the docs pipeline. */
const STALE_OUTPUT_PATTERNS = [
  { re: /\bCLAUDE\/[A-Z]/,          label: 'CLAUDE/' },
  // Harness-repo paths are invisible at execution time (a scaffolded project never
  // contains them). Naming the blueprint as the human's scaffold SOURCE (no slash,
  // e.g. "re-copy from blueprint-repo") is legitimate; a PATH into it is not.
  { re: /\bcoding-skills\//,        label: 'coding-skills/' },
  { re: /\bblueprint-repo\//,       label: 'blueprint-repo/' },
  { re: /racine du repo harness|harness repo root/i, label: 'harness repo root' },
];

/** Absolute filesystem paths — forbidden in every skill, without exception.
 *
 *  A skill runs on someone else's machine. `file:///C:/Meteosure_shared/...` is
 *  not merely a leak of the author's directory layout in a repo meant to go
 *  public: it is a DEAD link for every user but one. Skills may reference
 *  project paths (`.shokunin/…`) and harness-relative paths — never a location
 *  that only exists on one computer.
 *
 *  Severity is graded by migration status (see `gradeAbsolutePath`): a V1 skill
 *  is declared finished, so a violation is an ERROR; a `v0-not-migrated` skill
 *  has not been rewritten yet, so it is a WARN — a migration checklist rather
 *  than a wall that blocks V1 work with V0 debt. */
const ABSOLUTE_PATH_PATTERNS = [
  { re: /file:\/\/\//i,            label: 'file:/// link' },
  { re: /\b[a-zA-Z]:[\\/]/,        label: 'Windows absolute path (C:\\…)' },
  { re: /(?:^|[\s(<"'])\/(?:Users|home|mnt|opt|var|etc)\//, label: 'POSIX absolute path (/Users/, /home/…)' },
];

/** Harness-meta skills are exempt from STALE_OUTPUT_PATH: they document the system
 *  structure itself and must name harness paths to do so (like add-new-skill). */
const HARNESS_META_SKILLS = new Set(['add-new-skill', 'training-ui-skill']);

/** Package-manager discipline (PATHS_REGISTRY §4): pnpm only, `pnpm dlx` for one-shot CLIs.
 *  A line is exempt if it states the ban itself or already uses pnpm. */
const PKG_MANAGER_RE = /(?:^|[^a-zA-Z.@/-])(npx\s+\S|yarn\s+(?:add|install|run)\b|npm\s+(?:run|install|ci|exec)\b)/;
const PKG_MANAGER_EXEMPT_RE = /pnpm|forbidden|interdit|jamais|never|not allowed|pollution/i;

/** Folder names must be kebab-case and byte-identical to `name:` (case-sensitive
 *  filesystems break otherwise — e.g. the old `Lessons-learned/` vs `lessons-learned`). */
const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const REQUIRED_FIELDS    = ['name', 'description'];
const RECOMMENDED_FIELDS = ['license'];
const DESC_MAX_CHARS     = 1000;
const MIN_BODY_CHARS     = 100;

// ─── Frontmatter parser ───────────────────────────────────────────────────────

function parseFrontmatter(rawContent) {
  // Normalize line endings so CRLF files don't skew slice offsets or regex checks
  const content = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (!content.startsWith('---')) {
    return { fields: {}, body: content, hasFrontmatter: false, malformed: false };
  }
  const end = content.indexOf('\n---', 3);
  if (end === -1) {
    return { fields: {}, body: content, hasFrontmatter: false, malformed: false };
  }

  const fm   = content.slice(4, end);
  const body = content.slice(end + 4).trimStart();

  // Detect malformed frontmatter: blank line at start, or a key with no
  // indented continuation that starts with whitespace (misaligned block scalar).
  const malformed = fm.startsWith('\n') || /\n{2,}[a-zA-Z]/.test(fm);

  const fields = {};
  const lines  = fm.split('\n');
  const KEY_RE = /^([a-zA-Z_][\w-]*):\s*(.*)/;
  const NEXT_KEY_RE = /^[a-zA-Z_][\w-]*\s*:/;

  let i = 0;
  while (i < lines.length) {
    const match = lines[i].match(KEY_RE);
    if (!match) { i++; continue; }

    const key  = match[1];
    const rest = match[2].trim();

    if (rest === '>' || rest === '|') {
      // Block scalar: collect until next key or end
      const parts = [];
      i++;
      while (i < lines.length && !NEXT_KEY_RE.test(lines[i])) {
        const trimmed = lines[i].trim();
        if (trimmed) parts.push(trimmed);
        i++;
      }
      fields[key] = parts.join(' ');
    } else if (rest.startsWith('"') || rest.startsWith("'")) {
      fields[key] = rest.replace(/^['"]|['"]$/g, '');
      i++;
    } else {
      fields[key] = rest;
      i++;
    }
  }

  return { fields, body, hasFrontmatter: true, malformed };
}

// ─── Validator ────────────────────────────────────────────────────────────────

function validateSkill(filePath) {
  const folder  = basename(dirname(filePath));
  const relPath = relative(ROOT, filePath);
  const findings = [];

  const error = (code, msg) => findings.push({ level: 'error', code, message: msg });
  const warn  = (code, msg) => findings.push({ level: 'warn',  code, message: msg });

  let raw = '';
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (e) {
    error('READ_FAIL', `Cannot read file: ${e.message}`);
    return { path: relPath, folder, valid: false, findings };
  }

  // Strip UTF-8 BOM
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);

  // Strip null bytes
  if (raw.includes('\x00')) {
    warn('NULL_BYTES', 'File contains null bytes — likely a write artefact');
    raw = raw.replace(/\x00/g, '');
  }

  const { fields, body, hasFrontmatter, malformed } = parseFrontmatter(raw);

  if (!hasFrontmatter) {
    error('NO_FRONTMATTER', 'Missing YAML frontmatter block (must start with ---)');
  }

  if (hasFrontmatter && malformed) {
    error('MALFORMED_FRONTMATTER', 'Malformed YAML frontmatter: blank line after opening --- or misaligned block scalar');
  }

  for (const f of REQUIRED_FIELDS) {
    if (!fields[f] || !fields[f].trim()) {
      error(`MISSING_${f.toUpperCase()}`, `Required field "${f}" is absent or empty`);
    }
  }

  for (const f of RECOMMENDED_FIELDS) {
    if (!fields[f]) {
      warn(`MISSING_${f.toUpperCase()}`, `Recommended field "${f}" is absent`);
    }
  }

  if (fields.name && fields.name.toLowerCase() !== folder.toLowerCase()) {
    warn('NAME_MISMATCH', `name: "${fields.name}" does not match folder "${folder}"`);
  } else if (fields.name && fields.name !== folder) {
    error('NAME_CASE_MISMATCH', `name: "${fields.name}" differs from folder "${folder}" only by case — breaks on case-sensitive filesystems`);
  }

  if (!KEBAB_RE.test(folder)) {
    error('FOLDER_NOT_KEBAB', `Folder "${folder}" is not kebab-case`);
  }

  if (fields.description) {
    const len = fields.description.trim().length;
    if (len > DESC_MAX_CHARS) {
      warn('DESC_TOO_LONG', `Description is ${len} chars (max ${DESC_MAX_CHARS})`);
    }
    if (len < 20) {
      error('DESC_TOO_SHORT', `Description is suspiciously short (${len} chars)`);
    }
  }

  if (body.trim().length < MIN_BODY_CHARS) {
    error('STUB_BODY', `Body is ${body.trim().length} chars — looks like a stub`);
  }

  if (!/^## /m.test(body)) {
    warn('NO_SECTIONS', 'No ## sections found — structure may be missing');
  }

  const bodyAndDesc = `${fields.description || ''}\n${body}`;
  if (!HARNESS_META_SKILLS.has(folder)) {
    for (const { re, label } of STALE_OUTPUT_PATTERNS) {
      if (re.test(bodyAndDesc)) {
        warn('STALE_OUTPUT_PATH', `References harness-invisible path "${label}" — use project paths (.shokunin/, scripts/) instead`);
      }
    }
  }

  // Absolute paths: no exemption, not even for harness-meta skills. A path that
  // exists on exactly one machine is broken for everyone else.
  const migrated = !/^0\.0\.0-v0$/.test((fields.version || '').trim());
  for (const { re, label } of ABSOLUTE_PATH_PATTERNS) {
    const hit = bodyAndDesc.match(re);
    if (!hit) continue;
    const line = bodyAndDesc.slice(0, hit.index).split('\n').length;
    const msg = `${label} at line ~${line} — absolute paths only exist on the author's machine; use a path relative to the project (.shokunin/…) or to the harness`;
    if (migrated) error('ABSOLUTE_PATH', msg);
    else warn('ABSOLUTE_PATH', `${msg} [v0-not-migrated: fix during migration]`);
  }

  for (const [idx, line] of body.split('\n').entries()) {
    if (PKG_MANAGER_RE.test(line) && !PKG_MANAGER_EXEMPT_RE.test(line)) {
      warn('FORBIDDEN_PKG_MANAGER', `Line ${idx + 1}: uses npm/npx/yarn — pnpm only (one-shot CLIs: \`pnpm dlx\`, PATHS_REGISTRY §4)`);
    }
  }

  if (/(?:password|secret|token)\s*[:=]\s*['"][^'"]{4,}/i.test(body)) {
    error('HARDCODED_SECRET', 'Possible hardcoded secret in body');
  }

  const valid = !findings.some((f) => f.level === 'error');
  return { path: relPath, folder, valid, findings };
}

// ─── Directory walker ─────────────────────────────────────────────────────────

function findSkillFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findSkillFiles(full));
    } else if (entry === 'SKILL.md') {
      results.push(full);
    }
  }
  return results.sort();
}

// ─── Reporters ────────────────────────────────────────────────────────────────

const R = '\x1b[0m';
const RED  = '\x1b[31m';
const YEL  = '\x1b[33m';
const GRN  = '\x1b[32m';
const BOLD = '\x1b[1m';
const DIM  = '\x1b[2m';
const CYN  = '\x1b[36m';

function reportHuman(results) {
  const errCount  = results.filter((r) => !r.valid).length;
  const warnCount = results.filter((r) => r.valid && r.findings.some((f) => f.level === 'warn')).length;
  const cleanCount = results.filter((r) => r.valid && r.findings.length === 0).length;

  console.log();
  console.log(`${BOLD}${CYN}Shokunin Skill Validator${R}`);
  const roots = ACTIVE_ROOTS.map((r) => relative(process.cwd(), r)).join('  +  ');
  console.log(`${DIM}Skills: ${roots}  |  Total: ${results.length}${R}`);
  console.log();

  for (const result of results) {
    const hasErr  = result.findings.some((f) => f.level === 'error');
    const hasWarn = result.findings.some((f) => f.level === 'warn');
    const icon    = hasErr ? `${RED}✗${R}` : hasWarn ? `${YEL}⚠${R}` : `${GRN}✓${R}`;
    const badge   = hasErr ? `${RED}ERROR${R}` : hasWarn ? `${YEL}WARN ${R}` : `${GRN}OK   ${R}`;
    console.log(`  ${icon} ${badge}  ${result.path}`);
    for (const f of result.findings) {
      const c = f.level === 'error' ? RED : YEL;
      const p = f.level === 'error' ? 'ERR' : 'WRN';
      console.log(`         ${c}[${p}:${f.code}]${R} ${f.message}`);
    }
  }

  console.log();
  console.log(`${BOLD}Summary${R}`);
  console.log(`  Total     : ${results.length}`);
  console.log(`  ${GRN}✓ Clean${R}   : ${cleanCount}`);
  console.log(`  ${YEL}⚠ Warnings${R}: ${warnCount}`);
  console.log(`  ${RED}✗ Errors${R}  : ${errCount}`);
  if (STRICT && warnCount > 0) {
    console.log();
    console.log(`${YEL}--strict: warnings treated as errors${R}`);
  }
  console.log();
  if (errCount === 0 && (!STRICT || warnCount === 0)) {
    console.log(`${GRN}${BOLD}All skills are ready.${R}`);
  } else {
    console.log(`${RED}${BOLD}Fix the errors above before shipping.${R}`);
  }
  console.log();
}

function reportJson(results) {
  const totalErrors   = results.reduce((n, r) => n + r.findings.filter((f) => f.level === 'error').length, 0);
  const totalWarnings = results.reduce((n, r) => n + r.findings.filter((f) => f.level === 'warn').length, 0);
  console.log(JSON.stringify({ total: results.length, errors: totalErrors, warnings: totalWarnings, skills: results }, null, 2));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

if (ACTIVE_ROOTS.length === 0) {
  console.error(`[ERROR] no skill tree found — looked for:\n${SKILL_ROOTS.map((r) => `  ${relative(ROOT, r)}`).join('\n')}`);
  process.exit(1);
}

const skillFiles = ACTIVE_ROOTS.flatMap((r) => findSkillFiles(r));
const results = skillFiles.map((f) => validateSkill(f));

if (JSON_OUTPUT) {
  reportJson(results);
} else {
  reportHuman(results);
}

const hasErrors = results.some((r) =>
  r.findings.some((f) => f.level === 'error' || (STRICT && f.level === 'warn'))
);
process.exit(hasErrors ? 1 : 0);
