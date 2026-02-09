## Goal
Melting Soul MVP - AI Agent Soul을 ERC-1155 NFT로 거래하는 마켓플레이스

## Current Status
Phase 5 완료 - 최종 폴리시 & 배포 준비

## What Was Tried
- Phase 0: docs + .gitignore 커밋
- Phase 1: 프로젝트 세팅 (Next.js 15.5.5 + Foundry + deps)
- Phase 2: 스마트 컨트랙트 (SoulNFT, SoulSale, Vault) + 프론트 기초 (providers, Header, lib)
- Phase 2 fix: buy()에 to 파라미터 추가 (x402/agent 확장성)
- Phase 3: 페이지 5개 + 컴포넌트 5개 + 훅 5개 + Mock Data
- Phase 4: Supabase 스키마 + .env 설정 + 훅 Supabase 연동 (mock fallback)
- Phase 5: SeedSouls 스크립트 + 랜딩페이지 폴리시 + 최종 빌드 확인

## Next Steps
1. Supabase 프로젝트 생성 → schema.sql 실행 → .env.local에 키 입력
2. Monad Testnet에 컨트랙트 배포 (Deploy.s.sol)
3. SeedSouls.s.sol로 16개 시드 Soul 민팅
4. .env.local에 배포된 컨트랙트 주소 입력
5. Vercel 배포

## Context
- 기술 스택: Next.js 15.5.5 + TypeScript + Tailwind v4, Foundry, RainbowKit + wagmi v2, Supabase
- 체인: Monad Testnet (chainId: 10143)
- 핵심: ERC-1155 Soul NFT, Fork 시스템, Lineage 로열티, 족보 시각화
- 16종 시드 Soul 포함
- Supabase 미설정 시 mock data fallback 동작
