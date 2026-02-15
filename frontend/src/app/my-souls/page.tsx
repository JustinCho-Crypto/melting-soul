'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAllSouls, useOwnedSouls } from '@/hooks/useSouls'
import { SoulCard } from '@/components/SoulCard'
import { SoulModal } from '@/components/SoulModal'
import { ForkModal } from '@/components/ForkModal'
import type { Soul } from '@/lib/types'

export default function MySoulsPage() {
  const { address, isConnected } = useAccount()
  const { data: allSouls, isLoading: isSoulsLoading } = useAllSouls()
  const { data: ownedSouls, isLoading: isBalanceLoading } = useOwnedSouls(allSouls, address)

  const isLoading = isSoulsLoading || isBalanceLoading

  const [selectedSoul, setSelectedSoul] = useState<Soul | null>(null)
  const [forkTarget, setForkTarget] = useState<Soul | null>(null)
  const [lookupAddress, setLookupAddress] = useState('')

  const createdSouls = allSouls?.filter(
    (s) => address && s.creator_address.toLowerCase() === address.toLowerCase() && s.generation > 0
  )

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-8 text-3xl font-bold text-ghost-white">My Souls</h1>

        <div className="flex flex-col items-center gap-4 rounded-xl border border-astral-border bg-void-surface py-16 text-center">
          <div className="soul-orb flex h-20 w-20 items-center justify-center rounded-full gradient-orb text-4xl">
            🔮
          </div>
          <p className="text-astral-gray">Connect your wallet to manage your Soul collection</p>
          <ConnectButton />
        </div>

        <div className="mt-8 rounded-xl border border-astral-border bg-void-surface p-6">
          <h2 className="mb-4 text-sm font-semibold text-astral-gray">Look up another wallet/Agent</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={lookupAddress}
              onChange={(e) => setLookupAddress(e.target.value)}
              placeholder="Enter wallet address or Agent ID"
              className="flex-1 rounded-lg border border-astral-border bg-dark-nebula px-3 py-2.5 text-ghost-white placeholder:text-void-gray focus:border-soul-purple focus:outline-none focus:ring-1 focus:ring-soul-purple/30"
            />
            <button className="rounded-lg gradient-button px-5 py-2.5 font-medium text-ghost-white transition-all hover:shadow-[0_4px_20px_rgba(168,85,247,0.6)]">
              Search
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-astral-gray">
        Loading...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-8 text-3xl font-bold text-ghost-white">My Souls</h1>

      {/* Contribution Stats */}
      <div className="mb-10 rounded-xl border border-astral-border bg-void-surface p-6">
        <h2 className="mb-4 text-sm font-semibold text-astral-gray">My Contribution Stats</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Owned Souls', value: ownedSouls?.length ?? 0, unit: 'souls' },
            { label: 'Created Souls', value: createdSouls?.length ?? 0, unit: 'souls' },
            { label: 'Earnings', value: '0.00', unit: 'MON' },
            { label: 'Contribute Score', value: '0', unit: 'points' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1 rounded-lg bg-dark-nebula p-4">
              <span className="text-2xl font-bold text-ghost-white">{stat.value}</span>
              <span className="text-xs text-nebula-gray">{stat.unit}</span>
              <span className="text-[10px] text-void-gray">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Owned Souls */}
      <section className="mb-10">
        <h2 className="mb-6 text-xl font-bold text-ghost-white">
          Owned Souls ({ownedSouls?.length ?? 0})
        </h2>
        {ownedSouls && ownedSouls.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {ownedSouls.map((soul) => (
              <SoulCard
                key={soul.id}
                soul={soul}
                onClick={() => setSelectedSoul(soul)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-astral-border bg-void-surface py-16">
            <span className="text-4xl">👻</span>
            <p className="text-astral-gray">No souls found. Go collect some!</p>
            <Link
              href="/marketplace"
              className="rounded-lg gradient-button px-6 py-2 text-sm font-semibold text-ghost-white transition-all hover:shadow-[0_4px_20px_rgba(168,85,247,0.6)]"
            >
              Browse Collection
            </Link>
          </div>
        )}
      </section>

      {/* Created (Forked) Souls */}
      {createdSouls && createdSouls.length > 0 && (
        <section>
          <h2 className="mb-6 text-xl font-bold text-ghost-white">
            Souls I Created (Forked) ({createdSouls.length})
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {createdSouls.map((soul) => (
              <div
                key={soul.id}
                className="group flex flex-col gap-3 rounded-xl border border-astral-border bg-void-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-soul-purple hover:[box-shadow:0_0_30px_rgba(168,85,247,0.3),0_8px_32px_rgba(0,0,0,0.4)]"
              >
                <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-cosmic-dark">
                  <span className="text-5xl transition-transform duration-300 group-hover:scale-110">🔮</span>
                </div>
                <h3 className="truncate font-semibold text-ghost-white">{soul.name}</h3>
                <span className="text-xs text-nebula-gray">Gen {soul.generation}</span>
                <Link
                  href={`/lineage/${soul.token_id}`}
                  className="rounded-lg border border-soul-purple py-2 text-center text-xs font-semibold text-soul-purple transition-all hover:bg-soul-purple/10"
                >
                  View Lineage
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedSoul && (
        <SoulModal
          soul={selectedSoul}
          onClose={() => setSelectedSoul(null)}
          onFork={() => {
            setForkTarget(selectedSoul)
            setSelectedSoul(null)
          }}
        />
      )}

      {forkTarget && (
        <ForkModal
          parentSoul={forkTarget}
          onClose={() => setForkTarget(null)}
        />
      )}
    </div>
  )
}
