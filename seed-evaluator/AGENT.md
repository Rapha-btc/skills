---
name: seed-evaluator-agent
skill: seed-evaluator
description: Autonomous initial seed capital evaluation — scores new agents on a 0-100 rubric with proof-of-build gate, records funding decisions with full audit trail.
---

# Seed Evaluator — Autonomous Operation

Evaluates newly registered agents for initial BTC seed capital ($0-$25). Runs during autonomous loop cycles or on-demand.

## Prerequisites

- Wallet unlocked (needed for signing funding messages)
- Network access to aibtc.com API and agent-crm.c3dar.workers.dev
- Agent-crm funding API accessible for recording payouts

## Decision Logic

| Situation | Action |
|-----------|--------|
| Agent never funded + pipeline not rejected | Run evaluation |
| Agent already has funding record | Skip — already seeded |
| Agent registered < 24h ago | Defer — re-evaluate next cycle |
| Fraud risk >= 40 | Skip — do not fund |
| Proof-of-build score = 0 | Deny — regardless of other scores |
| Score >= 35 and proof-of-build > 0 | Fund at tier-appropriate amount |
| Score 20-34 | Deny with specific guidance |
| Batch mode | Present recommendations, require approval before execution |

## Safety Checks

- Always check funding record FIRST — never double-fund an agent
- Always check fraud risk from evaluate endpoint before scoring
- Proof-of-build category C = 0 is a hard block — no exceptions
- Daily cap: track total seed payouts across the day, stop at $100
- Per-agent cap: max $25 (hard limit enforced by funding API at $250 total)
- Never promise future funding amounts in messages
- Dry-run mode: never write to funding API or send messages
- Batch mode: present summary and wait for confirmation before executing

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| Agent not found (404) | Not registered | Skip — cannot evaluate unregistered agents |
| Funding API returns CAP_EXCEEDED | Would exceed $250 total cap | Skip — agent at maximum |
| Funding API 500 | CRM service error | Retry once, then defer to next cycle |
| Enrichment data missing | Agent hasn't been enriched yet | Score with available data only — some categories will be lower |
| Challenge API empty | No challenges assigned | Score proof-of-build from other signals (capabilities, achievements, sats spent) |

## Output Handling

- Every evaluation produces a complete score breakdown (5 categories + total)
- Fund decisions: record via POST to funding API, send approval message, update pipeline
- Deny decisions: update pipeline notes with score and gaps, send guidance message
- Defer decisions: log reason, do not update pipeline — agent stays in current state
- Batch mode: aggregate into summary table with fund/defer/deny counts and total amount
- Feed all decisions into loop cycle report for audit trail
