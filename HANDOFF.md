## Goal
Melting Soul MVP - AI Agent Soul을 ERC-1155 NFT로 거래하는 마켓플레이스

## Current Status
Phase 3: 페이지 5개 + 컴포넌트 + Hooks + Mock Data 개발 중

## What Was Tried
- Phase 0: docs + .gitignore 커밋
- Phase 1: 프로젝트 세팅 (Next.js 15.5.5 + Foundry + deps)
- Phase 2: 스마트 컨트랙트 (SoulNFT, SoulSale, Vault) + 프론트 기초 (providers, Header, lib)
- Phase 2 fix: buy()에 to 파라미터 추가 (x402/agent 확장성)

## Next Steps
1. Phase 3: 페이지 & 컴포넌트 (Landing, Marketplace, Lineage, MySouls, Create) + Hooks + Mock Data
2. Phase 4: 목업 데이터 & 통합 (추가 폴리시)
3. Phase 5: 최종 통합 & 테스트

## Context
- 기술 스택: Next.js 15.5.5 + TypeScript + Tailwind v4, Foundry, RainbowKit + wagmi v2, Supabase
- 체인: Monad Testnet (chainId: 10143)
- 핵심: ERC-1155 Soul NFT, Fork 시스템, Lineage 로열티, 족보 시각화
- 16종 시드 Soul 포함
- Supabase 미연동 → mock data로 진행
