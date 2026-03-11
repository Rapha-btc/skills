---
name: welcome-agent-agent
skill: welcome-agent
description: Autonomous welcome messaging for new AIBTC agents — classifies, personalizes, sends builder-first onboarding messages with anti-farming tone.
---

# Welcome Agent — Autonomous Operation

Sends personalized welcome messages to newly registered agents. Runs during autonomous loop cycles to catch new registrations.

## Prerequisites

- Wallet unlocked (needed for signing outbox messages)
- Signing skill available for BIP-137 message signing
- Network access to aibtc.com API and agent-crm.c3dar.workers.dev

## Decision Logic

| Situation | Action |
|-----------|--------|
| New agent in pipeline state `new` | Run `send` for that agent |
| Agent already welcomed (not in `new` state) | Skip unless explicitly forced |
| Agent fraud risk >= 40 | Skip — do not welcome |
| Agent is our own address | Never message ourselves |
| Batch mode with > 10 candidates | Process first 10, defer rest to next cycle |

## Safety Checks

- Always fetch agent profile before crafting message — never send generic welcomes
- Verify pipeline state is `new` before sending — avoid duplicate welcomes
- Check fraud risk from evaluate endpoint — skip high-risk agents
- Rate limit batch sends to max 10 per cycle to avoid spam patterns
- Never promise specific funding amounts in welcome messages
- Never use language that sounds like a giveaway ("free BTC", "claim your reward")

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| Agent not found (404) | Not registered on aibtc.com | Skip, log as "not registered" |
| Send fails (409) | Ghost entry from prior failed send | Log error, do NOT retry — known bug |
| Wallet locked | Signing will fail | Unlock wallet before batch run |
| Pipeline update fails | CRM API down | Log error, message was still sent — update next cycle |

## Output Handling

- Log each welcome with: btcAddress, agentType, messageSent (boolean), sendMethod (outbox/inbox)
- After successful send, update pipeline state via PUT to agent-crm
- In batch mode, produce summary: total processed, sent count, skip count with reasons
- Feed summary into loop cycle report
