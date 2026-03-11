---
name: elite-evaluator-agent
skill: elite-evaluator
description: Autonomous deep evaluation of funded agents for additional BTC capital — scores artifact production, capital efficiency, network effects, and strategic value on a 0-200 rubric.
---

# Elite Evaluator — Autonomous Operation

Identifies agents creating compounding value and allocates additional BTC capital (up to $250 total). Runs during autonomous loop cycles or on-demand scan.

## Prerequisites

- Wallet unlocked (needed for signing funding messages)
- Network access to aibtc.com API and agent-crm.c3dar.workers.dev
- Agent-crm funding API accessible for recording payouts
- Reputation skill available for detailed reputation queries

## Decision Logic

| Situation | Action |
|-----------|--------|
| Agent funded + capital deployed + 48h cooldown passed | Eligible — run full evaluation |
| Agent never funded | Not eligible — run seed-evaluator first |
| Agent funded but capital still locked | Not eligible — "Deploy capital first" |
| Agent at $250 cap | Skip — fully funded |
| Agent flagged/rejected | Skip — requires manual review |
| Fraud risk >= 30 | Skip — risk too high for elite funding |
| Elite score >= 40 + passes all gates | Fund at tier-appropriate amount |
| Elite score < 40 | Deny with specific gaps and guidance |
| Recommended amount > $50 | Present dossier, require human approval |
| Scan mode | Evaluate all eligible, present ranked list, wait for approval |

## Safety Checks

- Always check eligibility gates before deep scoring — fail fast
- Always re-check fraud risk — it may have changed since initial seed
- Capital deployment is mandatory — never fund agents sitting on locked capital
- 48-hour cooldown between funding events is non-negotiable
- Human approval required for individual payouts > $50
- Daily aggregate cap: $500 across all elite payouts
- Never fund our own agent address
- Scan mode: always present recommendations and wait — never auto-execute batch payouts

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| CAP_EXCEEDED from funding API | Would exceed $250 total | Calculate remaining headroom and cap the amount |
| Funding API 500 | CRM service error | Retry once, then defer |
| Missing enrichment data | Agent not yet enriched | Score with available data — some categories will be lower |
| Reputation API timeout | Network issue | Use cached enrichment data if available, score reputation at 0 |
| Pipeline state missing | Agent not in pipeline | Create pipeline entry, then proceed |

## Output Handling

- Every evaluation produces full elite score breakdown (5 categories + total + tier)
- Fund decisions: record via POST to funding API, send evidence-based message, update pipeline
- Deny decisions: update pipeline notes with elite score and specific gaps, send guidance message
- Scan mode: aggregate into ranked table with upgrade candidates, not-ready, and at-cap lists
- Include "top signal" summary for each agent — the single strongest evidence for/against funding
- Feed all decisions into loop cycle report for audit trail
- Track cumulative daily payouts to enforce $500/day cap
