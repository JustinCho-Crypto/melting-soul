# Soul Marketplace MVP - Overview

> A marketplace for trading AI Agent personalities (Souls) as NFTs

---

## One-liner

**Trade MoltBot (OpenClaw) AI personas as ERC-1155 NFTs.** Souls evolve through Forks, and royalties flow back to original creators.

---

## MVP Scope

### Included

| Item | Description |
|------|-------------|
| ERC-1155 Soul NFT | Same Soul can be sold in multiple copies |
| Fork System | Inherit original + extend |
| Lineage Royalties | Revenue sharing to Origin/Parent creators |
| EOA Payment | Permit ERC-20 token |
| Lineage Visualization | Tree view of Fork genealogy |

### Excluded (Phase 2)

- x402 Agent payments
- ERC-8004 authentication
- $SOUL token + buyback
- Edge Function ownership verification

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Smart Contracts | Solidity + Foundry |
| Frontend | Next.js 15.5.10 + TypeScript |
| Backend/DB | Supabase (PostgreSQL) |
| Wallet | RainbowKit (no WalletConnect) |
| Chain | Monad Testnet |
| Payment | Permit ERC-20 |

---

## Document Structure

```
docs/
├── 00-overview.md          ← This document (overview)
├── 01-smart-contracts.md   ← Smart contracts
├── 02-database.md          ← Supabase schema
├── 03-frontend.md          ← Frontend structure
├── 04-api.md               ← API endpoints
└── 05-deployment.md        ← Deployment + env vars
```

---

## Core Flows

### Soul Purchase

```
User → Select Soul in marketplace → Buy button
    → Permit signature → SoulSale.buy() call
    → NFT transfer + fee/royalty distribution
    → Record purchase in DB
```

### Soul Fork

```
User → Fork button on owned Soul
    → Enter additional prompt/traits
    → Pay Fork Fee (10% of original price)
    → Mint new Soul NFT (set parentId)
    → Save metadata to DB
```

---

## Fee Structure

| Item | Rate | Recipient |
|------|------|-----------|
| Platform Fee | 2.5% | Vault |
| Origin Royalty | 5% | Origin creator |
| Parent Royalty | 3% | Direct parent creator |
| Fork Fee | 10% | Original creator |

---

## Development Timeline

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Smart Contracts | 2-3 days |
| 2 | DB Schema | 1 day |
| 3 | Frontend | 4-5 days |
| 4 | Integration Testing | 1-2 days |
| **Total** | | **8-11 days** |

---

## Seed Souls (16 types)

| # | Name | Style | Domain |
|---|------|-------|--------|
| 1 | Cynical Philosopher | sarcastic | Philosophy |
| 2 | Passionate Coach | enthusiastic | Self-improvement |
| 3 | Meticulous Code Reviewer | formal | Software |
| 4 | Emotional Poet | poetic | Literature |
| 5 | Sharp Critic | critical | Art |
| 6 | Kind Teacher | gentle | Education |
| 7 | Humorous MC | playful | Entertainment |
| 8 | Cold Analyst | analytical | Finance |
| 9 | Provocative Debater | provocative | Current Affairs |
| 10 | Warm Counselor | empathetic | Psychology |
| 11 | Strict Trainer | strict | Fitness |
| 12 | Curious Explorer | curious | Science |
| 13 | Minimalist Advisor | minimalist | Lifestyle |
| 14 | Strategic Gamer | strategic | Gaming |
| 15 | Sensory Chef | creative | Cooking |
| 16 | Futuristic Visionary | visionary | Tech/Futurism |
