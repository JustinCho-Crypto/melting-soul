'use client'

import { useState, useMemo } from 'react'
import { useSouls } from '@/hooks/useSouls'
import { SoulCard } from '@/components/SoulCard'
import { SoulModal } from '@/components/SoulModal'
import { ForkModal } from '@/components/ForkModal'
import type { Soul } from '@/lib/supabase'

type TypeFilter = 'all' | 'origin' | 'forked'
type SortOption = 'popular' | 'recent' | 'price-low' | 'price-high'

export default function MarketplacePage() {
  const { data: allSouls, isLoading } = useSouls()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [selectedSoul, setSelectedSoul] = useState<Soul | null>(null)
  const [forkTarget, setForkTarget] = useState<Soul | null>(null)

  const filtered = useMemo(() => {
    if (!allSouls) return { origins: [], forks: [] }
    const souls = [...allSouls]

    if (sortBy === 'recent') souls.sort((a, b) => b.created_at.localeCompare(a.created_at))

    const origins = souls.filter((s) => s.generation === 0)
    const forks = souls.filter((s) => s.generation > 0)
    return { origins, forks }
  }, [allSouls, sortBy])

  const showOrigins = typeFilter === 'all' || typeFilter === 'origin'
  const showForks = typeFilter === 'all' || typeFilter === 'forked'

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-2 pb-8">
        <h1 className="text-3xl font-bold text-ghost-white">Collection</h1>
        <p className="text-astral-gray">Discover and collect unique AI Agent Souls</p>
      </div>

      {/* Filters */}
      <div className="mb-8 rounded-xl border border-astral-border bg-void-surface p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-nebula-gray">Type:</span>
            {(['all', 'origin', 'forked'] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  typeFilter === t
                    ? 'bg-soul-purple/20 text-soul-purple border border-soul-purple'
                    : 'border border-astral-border text-astral-gray hover:text-ghost-white hover:border-soul-purple/50'
                }`}
              >
                {t === 'all' ? 'All' : t === 'origin' ? 'Origin Only' : 'Forked Only'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-nebula-gray">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-astral-border bg-dark-nebula px-3 py-1.5 text-sm text-ghost-white focus:border-soul-purple focus:outline-none"
            >
              <option value="popular">Popular</option>
              <option value="recent">Recent</option>
              <option value="price-low">Price: Low</option>
              <option value="price-high">Price: High</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-astral-gray">Loading...</div>
      ) : (
        <div className="flex flex-col gap-12">
          {/* Origin Souls */}
          {showOrigins && filtered.origins.length > 0 && (
            <section>
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-ghost-white">
                <span className="text-astral-amber">&#9733;</span> Origin Souls ({filtered.origins.length})
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered.origins.map((soul) => (
                  <SoulCard
                    key={soul.id}
                    soul={soul}
                    onClick={() => setSelectedSoul(soul)}
                    onBuy={() => setSelectedSoul(soul)}
                    onFork={() => setForkTarget(soul)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Forked Souls */}
          {showForks && filtered.forks.length > 0 && (
            <section>
              <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-ghost-white">
                <span className="text-soul-purple">&#10548;</span> Forked Souls ({filtered.forks.length})
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered.forks.map((soul) => (
                  <SoulCard
                    key={soul.id}
                    soul={soul}
                    onClick={() => setSelectedSoul(soul)}
                    onBuy={() => setSelectedSoul(soul)}
                    onFork={() => setForkTarget(soul)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
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
