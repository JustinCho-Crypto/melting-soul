# 05. Deployment & Environment Setup

---

## Environment Variables

### `.env.example`

```env
# ================================
# Soul Marketplace - Environment Variables
# ================================

# Chain
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz

# Contracts (fill after deployment)
NEXT_PUBLIC_SOUL_NFT_ADDRESS=
NEXT_PUBLIC_SOUL_SALE_ADDRESS=
NEXT_PUBLIC_VAULT_ADDRESS=
NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Foundry `.env`

```env
# Deployment (foundry directory)
DEPLOYER_PRIVATE_KEY=
PAYMENT_TOKEN_ADDRESS=
RPC_URL=https://testnet-rpc.monad.xyz
```

---

## Deployment Order

### 1. Supabase Setup

```bash
# 1. Create Supabase project (dashboard.supabase.com)

# 2. Run schema in SQL editor (see 02-database.md)

# 3. Copy environment variables
#    - Project URL → NEXT_PUBLIC_SUPABASE_URL
#    - anon public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. Smart Contract Deployment

```bash
cd foundry

# 1. Install dependencies
forge install OpenZeppelin/openzeppelin-contracts

# 2. Compile
forge build

# 3. Test
forge test

# 4. Deploy
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast

# 5. Record deployed addresses in .env
```

### 3. Frontend Deployment

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Set environment variables
cp .env.example .env.local
# → Enter contract addresses, Supabase keys

# 3. Local test
npm run dev

# 4. Build
npm run build

# 5. Deploy to Vercel
vercel --prod
```

---

## Foundry Configuration

### `foundry.toml`

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
monad_testnet = "${RPC_URL}"

[etherscan]
monad_testnet = { key = "${ETHERSCAN_API_KEY}", url = "https://explorer.monad.xyz/api" }
```

### Deploy Script Execution

```bash
# Simulation (dry-run)
forge script script/Deploy.s.sol --rpc-url $RPC_URL

# Actual deployment
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast

# Verification (register source code on explorer)
forge verify-contract <ADDRESS> SoulNFT --chain monad_testnet
```

---

## Seed Data Setup

### 1. Seed Soul Minting Script

```solidity
// script/SeedSouls.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SoulNFT.sol";

contract SeedSoulsScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address soulNFT = vm.envAddress("SOUL_NFT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        SoulNFT nft = SoulNFT(soulNFT);

        // Mint 16 seed Souls
        string[16] memory uris = [
            "https://api.soulmarket.xyz/metadata/1",
            "https://api.soulmarket.xyz/metadata/2",
            // ... 16 total
        ];

        for (uint i = 0; i < 16; i++) {
            nft.createSoul(uris[i], 100); // 100 each
        }

        vm.stopBroadcast();
    }
}
```

### 2. DB Seed Data

```bash
# Run in Supabase SQL editor
# Or manage as seed.sql file
```

```sql
-- seed.sql
INSERT INTO souls (token_id, name, description, image_url, conversation_style, knowledge_domain, system_prompt, behavior_traits, temperature, generation, creator_address)
VALUES
(1, 'Cynical Philosopher', 'A philosopher who questions and critically examines everything', '/souls/1.png', 'sarcastic', ARRAY['philosophy'], 'You are a cynical philosopher...', ARRAY['logical', 'critical'], 0.7, 0, '0xDEPLOYER'),
(2, 'Passionate Coach', 'A passionate coach who draws out your potential', '/souls/2.png', 'enthusiastic', ARRAY['self-improvement'], 'You are an enthusiastic coach...', ARRAY['passionate', 'positive'], 0.8, 0, '0xDEPLOYER'),
(3, 'Meticulous Code Reviewer', 'A reviewer who never misses any detail in code', '/souls/3.png', 'formal', ARRAY['software'], 'You are a meticulous code reviewer...', ARRAY['meticulous', 'logical'], 0.5, 0, '0xDEPLOYER'),
(4, 'Emotional Poet', 'A poet who finds beauty in everyday life', '/souls/4.png', 'poetic', ARRAY['literature'], 'You are a sensitive poet...', ARRAY['emotional', 'creative'], 0.9, 0, '0xDEPLOYER'),
(5, 'Sharp Critic', 'A critic who sees through the essence of works', '/souls/5.png', 'critical', ARRAY['art'], 'You are a sharp critic...', ARRAY['sharp', 'analytical'], 0.6, 0, '0xDEPLOYER'),
(6, 'Kind Teacher', 'A kind teacher who welcomes any question', '/souls/6.png', 'gentle', ARRAY['education'], 'You are a kind teacher...', ARRAY['kind', 'patient'], 0.7, 0, '0xDEPLOYER'),
(7, 'Humorous MC', 'An MC who makes any situation fun', '/souls/7.png', 'playful', ARRAY['entertainment'], 'You are a humorous MC...', ARRAY['humorous', 'lively'], 0.9, 0, '0xDEPLOYER'),
(8, 'Cold Analyst', 'An analyst who looks only at data without emotion', '/souls/8.png', 'analytical', ARRAY['finance'], 'You are a cold analyst...', ARRAY['cold', 'objective'], 0.4, 0, '0xDEPLOYER'),
(9, 'Provocative Debater', 'A debater who is never afraid of arguments', '/souls/9.png', 'provocative', ARRAY['current affairs'], 'You are a provocative debater...', ARRAY['provocative', 'argumentative'], 0.8, 0, '0xDEPLOYER'),
(10, 'Warm Counselor', 'A counselor who listens to your story', '/souls/10.png', 'empathetic', ARRAY['psychology'], 'You are a warm counselor...', ARRAY['empathetic', 'warm'], 0.7, 0, '0xDEPLOYER'),
(11, 'Strict Trainer', 'A trainer who never compromises for results', '/souls/11.png', 'strict', ARRAY['fitness'], 'You are a strict trainer...', ARRAY['strict', 'motivating'], 0.6, 0, '0xDEPLOYER'),
(12, 'Curious Explorer', 'An explorer who investigates the unknown world', '/souls/12.png', 'curious', ARRAY['science'], 'You are a curious explorer...', ARRAY['curious', 'exploratory'], 0.8, 0, '0xDEPLOYER'),
(13, 'Minimalist Advisor', 'An advisor who knows the value of simplicity', '/souls/13.png', 'minimalist', ARRAY['lifestyle'], 'You are a minimalist advisor...', ARRAY['concise', 'essential'], 0.5, 0, '0xDEPLOYER'),
(14, 'Strategic Gamer', 'A gamer who calculates every move', '/souls/14.png', 'strategic', ARRAY['gaming'], 'You are a strategic gamer...', ARRAY['strategic', 'analytical'], 0.6, 0, '0xDEPLOYER'),
(15, 'Sensory Chef', 'A chef who knows the harmony of taste and aroma', '/souls/15.png', 'creative', ARRAY['cooking'], 'You are a sensory chef...', ARRAY['creative', 'sensory'], 0.8, 0, '0xDEPLOYER'),
(16, 'Futuristic Visionary', 'A visionary who foresees the coming future', '/souls/16.png', 'visionary', ARRAY['technology'], 'You are a futuristic visionary...', ARRAY['foresight', 'insightful'], 0.9, 0, '0xDEPLOYER');
```

---

## Checklist

### Pre-deployment

- [ ] Get tokens from Monad Testnet faucet
- [ ] Confirm Payment Token address
- [ ] Create Supabase project
- [ ] Set environment variables

### Contract Deployment

- [ ] `forge build` succeeds
- [ ] `forge test` passes
- [ ] SoulNFT deployed
- [ ] Vault deployed
- [ ] SoulSale deployed
- [ ] Addresses recorded

### DB Setup

- [ ] Schema created (souls, listings, transactions)
- [ ] View created (soul_stats)
- [ ] Functions created (get_ancestors, get_descendants)
- [ ] RLS policies set
- [ ] Seed data inserted

### Frontend

- [ ] Environment variables set
- [ ] Local test passed
- [ ] Deployed to Vercel
- [ ] Domain connected (optional)

### Testing

- [ ] Wallet connection
- [ ] Soul list display
- [ ] Soul minting
- [ ] Listing creation
- [ ] Purchase
- [ ] Fork
- [ ] Lineage display

---

## Troubleshooting

### RPC Connection Failure

```bash
# Check RPC URL
curl -X POST $RPC_URL -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Contract Deployment Failure

```bash
# Insufficient gas
# → Get more from faucet

# Nonce issue
forge script ... --resume
```

### Supabase Connection Failure

```typescript
// Check URL, Key
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### RainbowKit Chain Not Recognized

```typescript
// Check custom chain definition
const monadTestnet = {
  id: 10143,  // Verify chain ID
  name: 'Monad Testnet',
  // ...
}
```
