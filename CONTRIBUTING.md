# Contributing to index-ai

index-ai is an open specification proposal that makes websites **verifiably readable by AI agents**. The standard is in **RFC status** (`1.0-rc1`): feedback, questions, and pull requests that shape the next version are welcome.

This guide covers the repository layout, how to report issues, how to propose spec changes, and how to contribute code or documentation. For an overview, read the [README](README.md); for the standard itself, read the [specification](docs/spec/SPEC-v1.0-rc1.md).

## Table of contents

- [Repository layout](#repository-layout)
- [Spec version policy](#spec-version-policy)
- [Reporting issues](#reporting-issues)
- [Proposing spec changes](#proposing-spec-changes)
- [Pull request flow](#pull-request-flow)
- [Development and checks](#development-and-checks)
- [Licensing](#licensing)

## Repository layout

- `docs/spec/` — the specification (single source of truth; `SPEC-v1.0-rc1.md` + `index.md` overview)
- `docs/` — the VitePress documentation site: landing page, [quickstart](docs/quickstart.md), [comparison](docs/compare/llms-txt.md), [changelog](docs/changelog.md)
- `docs/.vitepress/theme/` — site theme, tokens, and components
- `docs/public/` — media assets for the site
- `schema/v1/` — the official JSON Schemas (manifest + Agent View)
- `ci/` — lint checks; `.github/workflows/` — the GitHub Actions quality + deploy workflows
- `tests/` + `e2e/` — Vitest unit/integrity tests and Playwright end-to-end tests

## Spec version policy

**Published spec versions are immutable.** Once a version is published, its requirements are fixed; a substantive correction ships as a **new version**. A visitor must always be able to trust that what a version says today is what it said when it was published.

The **one exception** is typo fixes — spelling, formatting, or broken links — which maintainers may apply without a version bump, because they change no requirement.

The current version is `1.0-rc1` (RFC). Substantive feedback is best given **now**, before a stable version is published.

## Reporting issues

Please use the issue templates rather than a blank box — they collect what a maintainer needs to act:

- **Bug report** — what you did, expected vs. actual behavior, where it happened (URL, section, or command), and your environment.
- **Question** — a topic and your question about implementing, validating, or conforming to index-ai.
- **Spec feedback** — your proposed change, the conformance level(s) affected, a section reference, and the version.

Search [existing issues](https://github.com/jordachmakaya/index-ai/issues) first — your problem may already be known.

## Proposing spec changes

1. Open a **rfc**-labeled issue describing the problem and your proposed wording, and reference the conformance level(s) affected (1 — AI Manifest, 2a — Agent Index, 2b — Agent Graph, 3 — Query Interface).
2. Discuss the proposal with maintainers; a change that survives discussion lands in the **next version** of the spec.
3. For **editorial or typo** fixes, a pull request is appropriate directly — no version bump is needed for typos.

Substantive changes are never retroactively applied to a published version (see the [version policy](#spec-version-policy)).

## Pull request flow

- **Base your PR on `develop`** — `main` is the stable, deploy branch.
- Keep changes minimal and focused: one concern per PR.
- Update or add tests for changed behavior — Vitest for unit/integrity, Playwright for site behavior.
- Run the checks below and confirm they pass.
- Describe the change and link any related issue.

## Development and checks

```bash
pnpm install       # install dependencies
pnpm docs:dev      # run the docs site locally
pnpm test          # unit/integrity tests (Vitest)
pnpm test:e2e      # end-to-end tests (Playwright)
pnpm typecheck     # TypeScript typecheck
pnpm lint          # repo lint (ci/lint.mjs)
pnpm docs:build    # production build of the docs site
```

## Licensing

- **Code and examples**: MIT — see [LICENSE](LICENSE).
- **Specification text**: Creative Commons Attribution 4.0 International (CC-BY-4.0) — see [LICENSE-SPEC](LICENSE-SPEC).

By contributing, you agree that your contributions are licensed under the same terms as the files they modify.
