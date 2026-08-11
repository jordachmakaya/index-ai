# CLAUDE.md — Router (Shokunin Harness)

This file routes. It contains no doctrine, no rules, no tables. Everything lives in `.shokunin/`.

## 1. Read the project status FIRST

```
.shokunin/PROJECT_STATUS.md
```

- **Missing** → this project is not born yet. Only the **Gate Agent** may act:
  load the `start-new-project` skill and run the qualification dialogue. Nothing else is allowed.
- **Present** → it tells you what this project is (nature × mode × size), where it stands,
  and exactly which documents to read for your task. Trust it — it is generated, not hand-written.

## 2. Load your agent profile

The human names your profile at session start ("you are the CTO", "you are the Reviewer"…):

```
.shokunin/agents/{profile}/AGENT.md
```

That file is your doctrine: your role, your write-list, your skills, your gates.
No profile named → **ask**. Never assume a role.

## 3. The STOP rule

Certainty < 98% → STOP and ask the human.
Never improvise a path, a gate, or a remote action.

---
Harness version: `.shokunin/VERSION` · Machine config: `.shokunin/harness.config.json`
