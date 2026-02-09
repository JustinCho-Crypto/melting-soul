# Phase 2 Review: Smart Contracts + Frontend Foundation

## Checklist
- [x] SoulNFT.sol - createSoul, forkSoul, mintMore, getLineage, uri
- [x] SoulSale.sol - list, buy(to), buyWithPermit(to), cancelListing, fee distribution
- [x] Vault.sol - withdraw, balance
- [x] Deploy.s.sol - deployment script
- [x] `forge build` - OK (solc 0.8.28)
- [x] `forge test` - 13/13 passed
- [x] providers.tsx - RainbowKit + Wagmi + ReactQuery (Monad Testnet)
- [x] layout.tsx - Providers + Header, dark theme
- [x] Header.tsx - logo, nav (Collection/My Souls/Create), ConnectButton
- [x] lib/supabase.ts - client + Soul/Listing types
- [x] lib/contracts.ts - ABIs + address constants
- [x] lib/utils.ts - shortenAddress, formatPrice
- [x] `npm run build` - OK

## Issues Found & Fixed
- **solc version**: OZ v5 requires ^0.8.24, bumped foundry.toml to 0.8.28
- **buy() extensibility**: added `to` parameter to `buy()` and `buyWithPermit()` for x402 agent payments, gifting, relay support. Payment from msg.sender, NFT to `to`.
- **Sold event**: added `recipient` field to track actual NFT receiver

## Test Coverage
| Test | Description |
|------|-------------|
| test_createSoul | Create origin soul, verify metadata |
| test_forkSoul | Fork soul, verify parent link + generation |
| test_forkSoul_revert_invalidParent | Revert on non-existent parent |
| test_mintMore | Creator mints additional supply |
| test_mintMore_revert_notCreator | Non-creator cannot mint |
| test_uri | Verify metadata URI |
| test_getLineage | 3-gen lineage traversal |
| test_listAndBuy | List + buy flow |
| test_cancelListing | Cancel and recover NFTs |
| test_feeDistribution_origin | Origin royalty (5%) + platform fee (2.5%) |
| test_buyToOtherAddress | Buy with `to` != msg.sender |
| test_vaultWithdraw | Vault withdrawal |
| test_vaultBalance | Vault balance check |
