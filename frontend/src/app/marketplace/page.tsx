'use client'

import { useState, useMemo } from 'react'
import { useAllSouls } from '@/hooks/useSouls'
import { SoulCard } from '@/components/SoulCard'
import { SoulModal } from '@/components/SoulModal'
import { ForkModal } from '@/components/ForkModal'
import type { Soul } from '@/lib/supabase'

type TypeFilter = 'all' | 'origin' | 'forked'
type SortOption = 'popular' | 'recent' | 'price-low' | 'price-high'
type GenFilter = 'all' | '0' | '1' | '2+'

export default function MarketplacePage() {
  const { data: allSouls, isLoading } = useAllSouls()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [domainFilter, setDomainFilter] = useState<string>('all')
  const [styleFilter, setStyleFilter] = useState<string>('all')
  const [genFilter, setGenFilter] = useState<GenFilter>('all')
  const [selectedSoul, setSelectedSoul] = useState<Soul | null>(null)
  const [forkTarget, setForkTarget] = useState<Soul | null>(null)

  const uniqueDomains = useMemo(() => {
    if (!allSouls) return []
    const set = new Set<string>()
    for (const s of allSouls) {
      s.knowledge_domain?.forEach((d: string) => set.add(d))
    }
    return Array.from(set).sort()
  }, [allSouls])

  const uniqueStyles = useMemo(() => {
    if (!allSouls) return []
    const set = new Set<string>()
    for (const s of allSouls) {
      if (s.conversation_style) set.add(s.conversation_style)
    }
    return Array.from(set).sort()
  }, [allSouls])

  const filtered = useMemo(() => {
    if (!allSouls) return { origins: [], forks: [] }
    let souls = [...allSouls]

    // Domain filter
    if (domainFilter !== 'all') {
      souls = souls.filter((s) => s.knowledge_domain?.includes(domainFilter))
    }

    // Style filter
    if (styleFilter !== 'all') {
      souls = souls.filter((s) => s.conversation_style === styleFilter)
    }

    // Gen filter
    if (genFilter === '0') souls = souls.filter((s) => s.generation === 0)
    else if (genFilter === '1') souls = souls.filter((s) => s.generation === 1)
    else if (genFilter === '2+') souls = souls.filter((s) => s.generation >= 2)

    // Sort
    if (sortBy === 'recent') souls.sort((a, b) => b.created_at.localeCompare(a.created_at))

    const origins = souls.filter((s) => s.generation === 0)
    const forks = souls.filter((s) => s.generation > 0)
    return { origins, forks }
  }, [allSouls, sortBy, domainFilter, styleFilter, genFilter])

  const showOrigins = typeFilter === 'all' || typeFilter === 'origin'
  const showForks = typeFilter === 'all' || typeFilter === 'forked'

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-2 pb-8">
        <h1 className="text-3xl font-bold text-ghost-white">Collection</h1>
        <p className="text-astral-gray">Discover and collect unique AI Agent Souls</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 rounded-xl border border-astral-border bg-void-surface p-4">
        {/* Row 1: Type + Sort */}
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

        {/* Row 2: Domain + Style + Gen */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-nebula-gray">Domain:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDomainFilter('all')}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                  domainFilter === 'all'
                    ? 'bg-soul-purple/20 text-soul-purple'
                    : 'bg-cosmic-dark text-nebula-gray hover:text-ghost-white'
                }`}
              >
                All
              </button>
              {uniqueDomains.map((d) => (
                <button
                  key={d}
                  onClick={() => setDomainFilter(d === domainFilter ? 'all' : d)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    domainFilter === d
                      ? 'bg-soul-purple/20 text-soul-purple'
                      : 'bg-cosmic-dark text-nebula-gray hover:text-ghost-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-nebula-gray">Style:</span>
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="rounded-lg border border-astral-border bg-dark-nebula px-3 py-1.5 text-xs text-ghost-white focus:border-soul-purple focus:outline-none"
            >
              <option value="all">All</option>
              {uniqueStyles.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-nebula-gray">Gen:</span>
            {(['all', '0', '1', '2+'] as GenFilter[]).map((g) => (
              <button
                key={g}
                onClick={() => setGenFilter(g)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  genFilter === g
                    ? 'bg-soul-purple/20 text-soul-purple border border-soul-purple'
                    : 'border border-astral-border text-astral-gray hover:text-ghost-white hover:border-soul-purple/50'
                }`}
              >
                {g === 'all' ? 'All' : g === '2+' ? '2+' : `Gen ${g}`}
              </button>
            ))}
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

          {filtered.origins.length === 0 && filtered.forks.length === 0 && (
            <div className="flex min-h-[20vh] items-center justify-center text-astral-gray">
              No souls match the selected filters
            </div>
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
