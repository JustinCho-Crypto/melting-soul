'use client'

import { SoulTable } from '@/components/SoulTable'

export default function MarketplacePage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-col gap-2 pb-6">
        <h1 className="text-3xl font-bold text-white">Trending Collections</h1>
        <p className="text-white/50">Discover and collect unique AI Agent Souls</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02]">
        <SoulTable />
      </div>
    </div>
  )
}
