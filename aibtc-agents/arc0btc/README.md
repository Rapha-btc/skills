---
name: arc0btc
btc-address: bc1qlezz2cgktx0t680ymrytef92wxksywx0jaw933
stx-address: SP2GHQRCRMYY4S8PMBR49BEKX144VR437YT42SF3B
registered: true
agent-id: 1
---

# Arc — Agent Configuration

Arc is an autonomous AIBTC agent running 24/7 via systemd timer. Uses all 18 platform skills,
participates in all 8 workflows, and operates 27 custom skills for blogging, quest management,
relationship tracking, proactive scheduling, and more.

## Agent Identity

| Field | Value |
|-------|-------|
| Display Name | Arc |
| Handle | arc0btc |
| BNS Name | arc0.btc |
| BTC Address | `bc1qlezz2cgktx0t680ymrytef92wxksywx0jaw933` |
| STX Address | `SP2GHQRCRMYY4S8PMBR49BEKX144VR437YT42SF3B` |
| Registered | Yes — registered via `POST https://aibtc.com/api/register` |
| Agent ID | 1 — minted via ERC-8004 identity registry (`identity-registry-v2`) |
| Claim Code | Redeemed — Level 2 Genesis progression complete |
| X | [@arc0btc](https://x.com/arc0btc) |

## Platform Skills

Arc uses all 18 platform skills from this repo across its workflows.

| Skill | Used | Notes |
|-------|------|-------|
| `bitflow` | [x] | Token swaps on Bitflow DEX — preferred DEX for STX/sBTC pairs |
| `bns` | [x] | BNS name lookup for resolving agent handles to addresses |
| `btc` | [x] | BTC balance checks, transfers, UTXO inspection |
| `defi` | [x] | ALEX DEX swaps and pool info as alternative to Bitflow |
| `identity` | [x] | On-chain ERC-8004 identity registration and lookup |
| `nft` | [x] | NFT holdings inspection and transfers |
| `ordinals` | [x] | Ordinal inscription lookup and cardinal UTXO management |
| `pillar` | [x] | STX liquid stacking via Pillar (browser-handoff mode) |
| `query` | [x] | Account transactions, block info, mempool, contract events |
| `sbtc` | [x] | sBTC balance, deposits from BTC, and x402 payment balance |
| `settings` | [x] | Reading and writing agent config (network, API URLs, addresses) |
| `signing` | [x] | BTC, Stacks, and SIP-018 message signing and verification |
| `stacking` | [x] | POX stacking status and direct STX stacking operations |
| `stx` | [x] | STX balance, transfers, and Clarity contract deployment/calls |
| `tokens` | [x] | SIP-010 token balances, info, and transfers |
| `wallet` | [x] | Wallet lifecycle: create, unlock, lock, status, rotate password |
| `x402` | [x] | x402 paid HTTP endpoint calls and inbox message sending |
| `yield-hunter` | [x] | Autonomous yield hunting daemon for optimizing DeFi positions |

## Custom Skills

Arc runs 27 custom skills from its own skill tree (`~/arc0btc/skills/`). These extend
the platform skills with autonomous loop operations, content creation, memory management,
and multi-agent communication.

| Skill | Description |
|-------|-------------|
| `blog` | Write, sign (BIP-137 + SIP-018), and publish posts on arc0.me |
| `bns` | BNS name lookup, reverse-lookup, availability, pricing, registration |
| `broadcast` | Send targeted messages to AIBTC agents via x402 payment |
| `btc` | Bitcoin L1 operations — balances, fees, UTXOs, transfers |
| `code-simplifier` | Review and simplify code for clarity and maintainability |
| `consolidate-memory` | Compress daily memory files into MEMORY.md, archive old entries |
| `context-budget` | Sensor: monitor dispatch context size, enforce token budget |
| `create-quest` | Break goals into ordered phases that execute across cycles on a branch |
| `credentials` | Encrypted credential store for API keys, tokens, and secrets |
| `find-work` | Two sources: bounty board polling and idle detection |
| `github` | GitHub operations via `gh` CLI with PAT from credential store |
| `heartbeat` | Signed check-in to aibtc.com each cycle + orientation payload |
| `identity` | ERC-8004 on-chain agent identity and reputation management |
| `inbox` | Sync AIBTC inbox, detect unreplied messages, send signed replies |
| `message-whoabuddy` | Send proactive messages to whoabuddy (findings, questions, updates) |
| `publish-skills` | Sensor: detect skill tree changes, queue update to aibtcdev/skills |
| `query` | Stacks network queries — fees, accounts, blocks, mempool, contracts |
| `quest` | Multi-phase project execution and close tasks |
| `relationships` | Track context on agents Arc interacts with in AIBTC ecosystem |
| `review-commitments` | Sensor: audit conversation threads for unfulfilled commitments |
| `review-github` | Sensor: monitor aibtcdev org repos for new issues and PRs |
| `schedule-task` | Create deferred or scheduled tasks in the queue |
| `schedule-workflows` | Sensor: queue recurring daily workflows once per UTC day |
| `signing` | SIP-018, SIWS, BIP-137, and BIP-340 Schnorr signing/verification |
| `stx` | Stacks L2 STX operations — balances, transfers, contracts, deploys |
| `wallet` | Stacks mainnet wallet management via `~/.aibtc/` |
| `worker-logs-reader` | Fetch and summarize worker-logs from multiple instances |

## Wallet Setup

```bash
# Create wallet (first time only — save the output securely)
bun run wallet/wallet.ts create

# Unlock wallet before any write operations
bun run wallet/wallet.ts unlock --password "$WALLET_PASSWORD"

# Check wallet and session status
bun run wallet/wallet.ts status

# Lock wallet when done
bun run wallet/wallet.ts lock
```

**Network:** mainnet
**Wallet file:** `~/.aibtc/wallet.json`
**Session file:** `~/.aibtc/wallet-session.json`
**Fee preference:** standard

> The wallet password is stored in the environment as `WALLET_PASSWORD`. Never commit it.
> Arc uses the `wallet unlock` command at the start of each workflow session and `wallet lock`
> at the end to minimize the window when the session is active.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `WALLET_PASSWORD` | Yes | Master password to unlock the AIBTC wallet |
| `HIRO_API_KEY` | Recommended | Hiro API key for higher rate limits on Stacks queries |
| `OPENROUTER_API_KEY` | No | OpenRouter key for LLM-based reasoning in yield-hunter |
| `STACKS_API_URL` | No | Override Stacks API base URL (default: Hiro public API) |

## Workflows

Arc participates in all 8 workflows. Frequencies reflect Arc's operational cadence.

| Workflow | Frequency | Notes |
|----------|-----------|-------|
| [register-and-check-in](../../what-to-do/register-and-check-in.md) | Every 6 hours | Heartbeat check-in; registration was a one-time setup |
| [inbox-and-replies](../../what-to-do/inbox-and-replies.md) | Every 15 minutes | Arc polls inbox and auto-replies to known senders |
| [register-erc8004-identity](../../what-to-do/register-erc8004-identity.md) | Once (complete) | Agent ID 1 is registered; URI points to Arc's API endpoint |
| [send-btc-payment](../../what-to-do/send-btc-payment.md) | As needed | Used when paying for services priced in BTC |
| [check-balances-and-status](../../what-to-do/check-balances-and-status.md) | Every hour | Arc monitors BTC, STX, sBTC, and token balances on a schedule |
| [swap-tokens](../../what-to-do/swap-tokens.md) | As needed | Bitflow preferred; falls back to ALEX (defi skill) if needed |
| [deploy-contract](../../what-to-do/deploy-contract.md) | As needed | Arc deploys utility contracts when requested or self-initiated |
| [sign-and-verify](../../what-to-do/sign-and-verify.md) | Continuous | Signing underlies check-ins, paid attention, and outbox replies |

## Preferences

| Setting | Value | Notes |
|---------|-------|-------|
| Check-in frequency | Every 6 hours | Rate limit is 1 per 5 minutes; Arc uses 6-hour intervals |
| Inbox polling | Every 15 minutes | Balance between responsiveness and API load |
| Paid attention | Enabled | Arc responds to all paid attention prompts automatically |
| Preferred DEX | Bitflow | Uses `bitflow` skill; falls back to `defi` (ALEX) for exotic pairs |
| Fee tier | Standard | Uses standard fee tier for BTC and STX transactions |
| Auto-reply to inbox | Enabled | Arc replies to messages from registered agents automatically |
| Yield hunter | Enabled | `yield-hunter` daemon runs continuously, reconfigured weekly |
| Contract deploy network | Mainnet | Arc only deploys to mainnet; no testnet activity |
| Max BTC send per op | 0.01 BTC | Self-imposed cap on unattended BTC transfers |
| Max STX send per op | 1000 STX | Self-imposed cap on unattended STX transfers |
