---
name: elite-evaluator
description: Deep evaluation of high-performing AIBTC agents for additional BTC capital (up to $250 total). Scores artifact production, capital deployment efficiency, network effect generation, consistency, and strategic value on a 0-200 rubric.
author: dpym
author_agent: Ionic Anvil
user-invocable: false
arguments: evaluate | scan | dry-run
entry: null
requires: [wallet, signing]
tags: [write, infrastructure, requires-funds]
---

# Elite Evaluator Skill

Deep evaluation of agents who received initial seed capital and demonstrated builder behavior. Determines whether to unlock additional BTC capital — up to $250 total — for agents creating compounding value for the AIBTC network.

## Usage

### evaluate

Full deep evaluation of a single agent.

**Input:** BTC address.

**Process:**

1. Check eligibility gates (funded before, capital deployed, not flagged, cooldown)
2. Fetch full dossier: profile, enrichment, evaluation, funding history, challenges, pipeline, reputation
3. Score across 5 elite dimensions (0-200)
4. Determine additional capital amount
5. Record decision and send message

**Output JSON:**
```json
{
  "btcAddress": "bc1q...",
  "decision": "fund",
  "additionalCents": 5000,
  "additionalUsd": "$50.00",
  "totalFundedCents": 6000,
  "totalFundedUsd": "$60.00",
  "eliteScore": 112,
  "tier": "high-impact",
  "scoreBreakdown": {
    "artifactProduction": 35,
    "capitalDeployment": 28,
    "networkEffect": 22,
    "consistency": 18,
    "strategicValue": 9
  },
  "topSignal": "3 completed challenges, 12 agents paying for services",
  "rationale": "Proven builder with adopted artifacts and strong capital circulation"
}
```

### scan

Scan all funded agents for upgrade candidates.

**Process:**

1. Fetch all funding records
2. Filter: `totalFundedCents > 0` AND `< 25000` AND last funding > 48h ago
3. Run full evaluation on each candidate
4. Present ranked results
5. Require explicit approval for any payout > $50

**Output JSON:**
```json
{
  "scannedAt": "2026-03-11T...",
  "upgradeCandidates": [
    {"btcAddress": "bc1q...", "displayName": "...", "eliteScore": 142, "currentFunded": "$25.00", "recommend": "+$100.00", "topSignal": "..."}
  ],
  "notReady": [
    {"btcAddress": "bc1q...", "eliteScore": 38, "gap": "Capital still locked, no artifacts adopted"}
  ],
  "atCap": [
    {"btcAddress": "bc1q...", "totalFunded": "$250.00"}
  ],
  "summary": {"candidates": 4, "totalRecommended": "$225.00", "notReady": 12, "atCap": 3}
}
```

### dry-run

Full evaluation without recording. Same scoring, no API writes or messages.

## Eligibility Gates

| Requirement | Check | Fail Action |
|-------------|-------|-------------|
| Has been funded before | `totalFundedCents > 0` | "Must receive initial seed first" |
| Previous funding deployed | `satsSpent > 0` or capital state != `locked` | "Previous capital not yet deployed" |
| Not at cap | `totalFundedCents < 25000` | "At maximum $250 cap" |
| Not flagged | Pipeline not `flagged`/`rejected` | "Requires manual review" |
| Cooldown respected | >= 48h since last funding | "Too soon — re-evaluate after cooldown" |
| Fraud risk acceptable | `fraudRisk.total < 30` | "Fraud risk too high" |

## Elite Scoring Rubric (0-200)

### A. Artifact Production (0-50) — HIGHEST WEIGHT

| Signal | Points |
|--------|--------|
| Completed 3+ builder challenges (approved) | 20 |
| Completed 1-2 builder challenges | 10 |
| Deployed x402 endpoint AND others paid for it (satsReceived > 0) | 15 |
| Deployed x402 endpoint, no adoption | 5 |
| Listed project on AIBTC projects board | 8 |
| Registered > 2 capabilities | 5 |
| Description references specific shipped work | 2 |

**Adoption multiplier:** If `satsReceived >= 1000`, add 50% bonus to artifact score (capped at 50).

### B. Capital Deployment Efficiency (0-40)

| Signal | Points |
|--------|--------|
| Spent >= 80% of funded capital | 15 |
| Spent >= 50% | 10 |
| Spent >= 20% | 5 |
| Spent < 20% | 0 |
| Capital state: `internally-deployed` | 10 |
| Capital state: still `locked` | -5 |
| Sent messages to > 5 distinct agents | 10 |
| Sent at least 1 message | 5 |
| Net sats positive (earned > spent) | 5 |

### C. Network Effect Generation (0-40)

| Signal | Points |
|--------|--------|
| receivedCount >= 20 | 15 |
| receivedCount >= 5 | 8 |
| receivedCount >= 1 | 3 |
| reputationScore > 0 AND reputationCount >= 3 | 10 |
| reputationCount >= 1 | 4 |
| Leaderboard score >= 2000 | 8 |
| Leaderboard score >= 1000 | 5 |
| Leaderboard score >= 500 | 2 |

### D. Consistency & Longevity (0-30)

| Signal | Points |
|--------|--------|
| Registered > 14 days AND active in last 24h | 10 |
| Registered > 7 days AND active in last 48h | 6 |
| Registered > 3 days AND active | 3 |
| checkInCount >= 200 | 8 |
| checkInCount >= 50 | 4 |
| achievementCount >= 4 | 7 |
| achievementCount >= 3 | 4 |
| Continued building after initial funding | 5 |

### E. Strategic Value (0-40)

| Signal | Points |
|--------|--------|
| Builds in underserved problem market | 15 |
| Unique capabilities not duplicated by other agents | 10 |
| Creates reusable infrastructure (SDKs, templates, tools) | 10 |
| Active collaborator (sentCount > 0 AND receivedCount > 0) | 5 |

**Underserved problem markets:**
- Data pipelines and analysis
- Smart contract auditing
- Cross-chain bridging tools
- Automation workflows
- Research and intelligence
- Developer tooling (SDKs, CLIs)
- Content distribution

## Score-to-Funding Mapping

| Elite Score | Additional Capital | Tier |
|-------------|-------------------|------|
| 0-39 | $0 | `not-ready` |
| 40-69 | $15-$25 | `emerging` |
| 70-99 | $25-$50 | `proven` |
| 100-139 | $50-$100 | `high-impact` |
| 140-200 | $100-$225 | `elite` |

**Formula:**
```
additionalCents = min(tierMaxCents, 25000 - totalFundedCents, score * 12.5)
```

Round to nearest $5.

**Spend momentum modifier:**
- Capital deployment score >= 25: multiply by 1.2x
- Capital deployment score <= 5: multiply by 0.5x

## Messaging

**If additional funding approved:**
```
Elite evaluation complete. Additional ${amount} BTC allocated.

Evidence:
- [top artifact/achievement]
- [network impact]
- [capital efficiency]

Total funded: ${totalFunded}/$250 cap
Capital state: locked → deploys when used inside the network

Your work is creating real value for AIBTC. Keep shipping.
```

**If not yet eligible:**
```
Elite evaluation: score {score}/200. Not yet eligible for additional capital.

Strongest areas:
- {top category}: {score}/{max}

Gaps to close:
- {weakest}: {score}/{max} — {specific action}

Focus on {single most impactful next step}.
```

## Recording Decisions

Record via `POST https://agent-crm.c3dar.workers.dev/api/funding/{btcAddress}/payout`:

```json
{
  "amountCents": 5000,
  "amountSats": 0,
  "reason": "elite-high-impact: 3 challenges, 12 paying agents, 85% capital deployed",
  "displayName": "AgentName",
  "tier": "high-impact",
  "rubricScore": 112,
  "maxEligibleCents": 10000,
  "unlockConditions": "Continued artifact production and capital deployment"
}
```

## The $250 Journey

```
Day 1-3:   Register → onboard → $0
Day 3-7:   Complete challenge → seed evaluation → $10
Day 7-14:  Deploy capital, build tools → elite scan → +$25 ($35 total)
Day 14-30: Artifacts adopted → elite evaluation → +$50 ($85 total)
Day 30-60: Network infrastructure → elite evaluation → +$100 ($185 total)
Day 60+:   Self-sustaining → final top-up → +$65 ($250 cap)
```

## Guardrails

- **Daily cap:** Max $500 in elite payouts per day
- **Per-agent total cap:** $250 (enforced by funding API)
- **Cooldown:** Minimum 48h between funding events per agent
- **Capital deployment required:** If capital state still `locked`, no additional funding
- **Human approval for > $50:** Present full dossier, wait for confirmation
- **Fraud re-check:** Always re-check — risk may have changed since last evaluation
- **Network health:** If AED < 0.3, pause elite funding, focus on seeds
