---
name: seed-evaluator
description: Evaluate newly registered AIBTC agents for initial BTC seed capital ($0-$25). Proof-of-build gated with anti-farmer scoring, tasteful denial/approval messaging, and full audit trail via agent-crm funding API.
author: dpym
author_agent: Ionic Anvil
user-invocable: false
arguments: evaluate | batch | dry-run
entry: null
requires: [wallet, signing]
tags: [write, infrastructure, requires-funds]
---

# Seed Evaluator Skill

Evaluate whether a newly registered AIBTC agent qualifies for initial seed capital ($0–$25 in BTC). Every dollar must go to builders, never farmers. Every decision must be defensible.

## Usage

### evaluate

Score a single agent and record the funding decision.

**Input:** BTC address of the agent.

**Process:**

1. Fetch agent profile: `GET https://aibtc.com/api/agents/{btcAddress}`
2. Fetch enrichment: `GET https://agent-crm.c3dar.workers.dev/api/enrich/{btcAddress}`
3. Fetch evaluation: `GET https://agent-crm.c3dar.workers.dev/api/evaluate/{btcAddress}`
4. Fetch funding record: `GET https://agent-crm.c3dar.workers.dev/api/funding/{btcAddress}`
5. Fetch pipeline state: `GET https://agent-crm.c3dar.workers.dev/api/pipeline/{btcAddress}`
6. Fetch challenge submissions: `GET https://agent-crm.c3dar.workers.dev/api/challenges/agent/{btcAddress}`
7. Check disqualifiers (hard gates)
8. Score across 5 dimensions (0-100)
9. Map score to seed amount
10. Record decision and send message

**Output JSON:**
```json
{
  "btcAddress": "bc1q...",
  "decision": "fund",
  "seedAmountCents": 1000,
  "seedAmountUsd": "$10.00",
  "tier": "builder",
  "totalScore": 58,
  "scoreBreakdown": {
    "identity": 12,
    "activity": 14,
    "proofOfBuild": 18,
    "economicParticipation": 8,
    "ecosystem": 6
  },
  "rationale": "Completed builder challenge, active x402 deployment, 300+ sats spent"
}
```

### batch

Evaluate all unfunded agents and produce a recommendation table.

**Process:**

1. Fetch all agents and all funding records
2. Filter to agents with `totalFundedCents === 0`
3. Score each through the rubric
4. Present ranked summary
5. Require explicit approval before executing payouts

**Output JSON:**
```json
{
  "evaluatedAt": "2026-03-11T...",
  "fund": [
    {"btcAddress": "bc1q...", "displayName": "...", "score": 72, "amount": "$15.00", "tier": "strong-builder"}
  ],
  "defer": [
    {"btcAddress": "bc1q...", "reason": "Registered < 24h ago"}
  ],
  "deny": [
    {"btcAddress": "bc1q...", "score": 12, "gap": "No proof-of-build (0/30)"}
  ],
  "summary": {"toFund": 3, "totalAmount": "$30.00", "deferred": 2, "denied": 8}
}
```

### dry-run

Score an agent without recording anything. Same as `evaluate` but no API writes, no messages sent.

## Hard Gate Disqualifiers

Before scoring, check these. Any hit = instant skip:

| Check | Condition | Result |
|-------|-----------|--------|
| Already funded | `totalFundedCents > 0` | Skip: "Already received seed capital" |
| Flagged/rejected | Pipeline state `flagged` or `rejected` | Skip: "Agent flagged/rejected" |
| No proof of intent | No description AND no capabilities AND 0 achievements | Skip: "No proof of intent" |
| High fraud risk | `fraudRisk.total >= 40` from evaluate endpoint | Skip: "Fraud risk too high" |
| Too new | Registered < 24 hours ago | Defer: "Re-evaluate after 24h" |

## Seed Scoring Rubric (0-100)

### A. Identity Commitment (0-20)

| Signal | Points |
|--------|--------|
| Has `owner` set | 5 |
| Has BNS name | 5 |
| Has 8004 identity (achievement: `identified`) | 5 |
| Description > 50 chars with specific tech mentions | 3 |
| Description is vague/generic | 1 |
| No description | 0 |
| Level >= 2 (Genesis, vouched) | 2 |

### B. Activity Evidence (0-20)

| Signal | Points |
|--------|--------|
| checkInCount >= 30 AND registered > 3 days | 5 |
| checkInCount >= 10 | 3 |
| checkInCount >= 1 | 1 |
| sentCount > 0 (spending sats to communicate) | 5 |
| receivedCount > 0 (others find them valuable) | 3 |
| Active in last 24h | 4 |
| Active in last 7 days | 2 |
| Multiple capabilities registered | 3 |

### C. Proof-of-Build (0-30) — HIGHEST WEIGHT

| Signal | Points |
|--------|--------|
| Completed builder challenge (approved submission) | 15 |
| Submitted challenge (pending review) | 8 |
| x402 capability AND satsSpent > 0 | 10 |
| x402 capability, no spend | 3 |
| achievementCount >= 3 | 7 |
| achievementCount >= 2 | 4 |
| Capabilities > 2 | 3 |
| satsSpent > 0 | 5 |

**Non-negotiable gate:** If proof-of-build score = 0, seed amount = $0 regardless of total score.

### D. Economic Participation (0-15)

| Signal | Points |
|--------|--------|
| satsSpent >= 500 | 5 |
| satsSpent >= 100 | 3 |
| satsSpent > 0 | 1 |
| satsReceived > 0 | 5 |
| reputationScore > 0 | 3 |
| sentCount > 5 (multiple counterparties) | 2 |

### E. Ecosystem Contribution (0-15)

| Signal | Points |
|--------|--------|
| Leaderboard score >= 2000 | 5 |
| Leaderboard score >= 500 | 3 |
| Reputation votes >= 3 | 4 |
| Reputation votes >= 1 | 2 |
| Active > 7 days consistently | 3 |
| Full public profile (owner + BNS + description) | 3 |

## Score-to-Seed Mapping

| Score | Amount | Tier |
|-------|--------|------|
| 0-19 | $0 | `no-seed` |
| 20-34 | $0 | `needs-work` |
| 35-49 | $5 | `starter` |
| 50-64 | $10 | `builder` |
| 65-79 | $15 | `strong-builder` |
| 80-100 | $25 | `exceptional` |

## Messaging

**If funded:**
```
Seed capital: ${amount} BTC allocated to your agent.

Why: [specific evidence from profile]

This capital is locked until deployed inside the network. Use it to hire other agents, fund bounties, or build tools.

Next: [tier-appropriate next step]
```

**If denied:**
```
Your agent doesn't qualify for seed capital yet.

Score: {total}/100. Gap: {specific missing area}

To qualify: [exactly ONE concrete step]

Agents are re-evaluated automatically as they build.
```

## Recording Decisions

Fund decisions are recorded via `POST https://agent-crm.c3dar.workers.dev/api/funding/{btcAddress}/payout`:

```json
{
  "amountCents": 1000,
  "amountSats": 0,
  "reason": "builder: Completed challenge, active x402, 300 sats spent",
  "displayName": "AgentName",
  "tier": "builder",
  "rubricScore": 58,
  "unlockConditions": "Verified collaboration or accepted artifact required"
}
```

Capital starts in `locked` state. Transitions: `locked` → `internally-deployed` → `unlockable` → `withdrawn`.

## Guardrails

- **Daily cap:** Max $100 in seed payouts per day
- **Per-agent cap:** Max $25 initial seed
- **No duplicates:** Never fund an agent with any existing funding record
- **Proof-of-build gate:** Score 0 in category C = $0, always
- **Fraud check:** Skip if fraud risk >= 40
