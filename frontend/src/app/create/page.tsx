'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useSouls } from '@/hooks/useSouls'
import { useForkSoul } from '@/hooks/useContracts'
import { syncSoulFromReceipt } from '@/lib/syncSupabase'
import { MODIFIERS, MODIFIER_CATEGORIES, TRAITS, getModifiersByCategory } from '@/lib/modifiers'
import type { Soul } from '@/lib/types'

export default function CreatePage() {
  const { address, isConnected } = useAccount()
  const { data: allSouls } = useSouls()
  const { fork, isLoading, receipt } = useForkSoul()

  // Soul selection
  const [selectedSoul, setSelectedSoul] = useState<Soul | null>(null)
  const [search, setSearch] = useState('')

  // Fork config
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([])
  const [traits, setTraits] = useState<Record<string, number>>({
    cynicism: 50, humor: 50, formality: 50, depth: 50, aggression: 50, empathy: 50,
  })
  const [temperature, setTemperature] = useState(0.7)
  const [customPrompt, setCustomPrompt] = useState('')
  const [forkName, setForkName] = useState('')
  const [forkPrice, setForkPrice] = useState(25)
  const synced = useRef(false)

  useEffect(() => {
    if (receipt?.status === 'success' && !synced.current && address && selectedSoul) {
      synced.current = true
      const traitStrings = Object.entries(traits).map(([k, v]) => `${k}:${v}`)
      syncSoulFromReceipt(receipt.logs, {
        name: forkName,
        description: customPrompt || `Fork of ${selectedSoul.name}`,
        image_url: selectedSoul.image_url,
        conversation_style: selectedSoul.conversation_style,
        knowledge_domain: selectedSoul.knowledge_domain,
        behavior_traits: traitStrings,
        temperature,
        parent_id: selectedSoul.id,
        fork_note: selectedModifiers.map(id => MODIFIERS.find(m => m.id === id)?.label).filter(Boolean).join(', ') || undefined,
        additional_prompt: customPrompt || undefined,
      }, address)
    }
  }, [receipt, address, selectedSoul, forkName, customPrompt, traits, temperature, selectedModifiers])

  const popularSouls = useMemo(() => {
    return allSouls?.filter((s) => s.generation === 0).slice(0, 4) ?? []
  }, [allSouls])

  const searchResults = useMemo(() => {
    if (!search || !allSouls) return []
    const q = search.toLowerCase()
    return allSouls.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8)
  }, [search, allSouls])

  const toggleModifier = (id: string) => {
    setSelectedModifiers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const handleFork = async () => {
    if (!selectedSoul || !forkName || !address) return
    synced.current = false
    const metadataUri = `ipfs://fork-${selectedSoul.token_id}-${Date.now()}`
    await fork(selectedSoul.token_id, metadataUri, 10)
  }

  // Step 0: Select a Soul
  if (!selectedSoul) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cosmic-dark text-3xl">
            🔀
          </div>
          <h1 className="text-3xl font-bold text-ghost-white">Fork an Existing Soul</h1>
          <p className="text-astral-gray">Add modifiers + adjust traits + describe your unique twist</p>
        </div>

        <div className="mb-8">
          <label className="mb-2 block text-sm font-medium text-astral-gray">Select a Soul to Fork</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Souls..."
            className="w-full rounded-lg border border-astral-border bg-dark-nebula px-4 py-3 text-ghost-white placeholder:text-void-gray focus:border-soul-purple focus:outline-none focus:ring-1 focus:ring-soul-purple/30"
          />
          {searchResults.length > 0 && (
            <div className="mt-2 flex flex-col rounded-lg border border-astral-border bg-void-surface">
              {searchResults.map((soul) => (
                <button
                  key={soul.id}
                  onClick={() => { setSelectedSoul(soul); setSearch('') }}
                  className="flex items-center gap-3 border-b border-astral-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-soul-purple/10"
                >
                  <span className="text-2xl">🔮</span>
                  <div>
                    <p className="font-medium text-ghost-white">{soul.name}</p>
                    <p className="text-xs text-nebula-gray">Gen {soul.generation} &middot; {soul.conversation_style}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-ghost-white">Popular Souls to Fork:</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popularSouls.map((soul) => (
              <button
                key={soul.id}
                onClick={() => setSelectedSoul(soul)}
                className="group flex flex-col gap-3 rounded-xl border border-astral-border bg-void-surface p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:border-soul-purple hover:[box-shadow:0_0_30px_rgba(168,85,247,0.3),0_8px_32px_rgba(0,0,0,0.4)]"
              >
                <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-cosmic-dark">
                  <span className="text-4xl transition-transform duration-300 group-hover:scale-110">🔮</span>
                </div>
                <h3 className="font-semibold text-ghost-white">{soul.name}</h3>
                <span className="rounded-full bg-astral-amber/20 px-2 py-0.5 text-[10px] font-semibold text-astral-amber w-fit">
                  Gen 0 &middot; Origin
                </span>
                <span className="text-sm font-semibold text-soul-purple">Fork &rarr;</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Steps 1-4: Fork Form
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <button
          onClick={() => setSelectedSoul(null)}
          className="text-sm text-astral-gray transition-colors hover:text-ghost-white"
        >
          &larr; Back to Soul selection
        </button>
      </div>

      <div className="mb-8 rounded-xl border border-astral-border bg-void-surface p-4">
        <p className="text-sm text-astral-gray">
          Forking from: <span className="font-semibold text-ghost-white">{selectedSoul.name}</span>
          {' '}(#{selectedSoul.token_id} &middot; Gen {selectedSoul.generation})
        </p>
        <p className="mt-1 text-xs text-nebula-gray">
          Fork Fee: 10% of parent price &rarr; Creator 70% / Buyback 20% / Treasury 10%
        </p>
      </div>

      {/* STEP 1: Quick Modifiers */}
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-bold text-ghost-white">STEP 1: Quick Modifiers</h2>
        <p className="mb-4 text-sm text-astral-gray">Select tags to quickly shape your Soul</p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MODIFIER_CATEGORIES.map((cat) => (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-semibold capitalize text-nebula-gray">{cat}</h3>
              <div className="flex flex-col gap-2">
                {getModifiersByCategory(cat).map((mod) => {
                  const isActive = selectedModifiers.includes(mod.id)
                  return (
                    <button
                      key={mod.id}
                      onClick={() => toggleModifier(mod.id)}
                      className={`rounded-md px-3 py-1.5 text-sm transition-all ${
                        isActive
                          ? 'border border-soul-purple bg-soul-purple/20 text-soul-purple shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                          : 'border border-astral-border bg-cosmic-dark text-astral-gray hover:border-soul-purple/50 hover:text-ghost-white'
                      }`}
                    >
                      {mod.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {selectedModifiers.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-nebula-gray">Selected:</span>
            {selectedModifiers.map((id) => {
              const mod = MODIFIERS.find((m) => m.id === id)
              return (
                <span key={id} className="rounded-full bg-soul-purple/20 px-2.5 py-0.5 text-xs font-medium text-soul-purple">
                  {mod?.label}
                </span>
              )
            })}
          </div>
        )}
      </section>

      {/* STEP 2: Trait Sliders */}
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-bold text-ghost-white">STEP 2: Fine-tune Traits</h2>
        <p className="mb-4 text-sm text-astral-gray">Adjust inherited traits from parent Soul</p>

        <div className="rounded-xl border border-astral-border bg-void-surface p-6">
          <div className="flex flex-col gap-5">
            {TRAITS.map((trait) => (
              <div key={trait.key}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-ghost-white">{trait.label}</span>
                  <span className="text-sm font-mono text-soul-purple">{traits[trait.key]}%</span>
                </div>
                <input
                  type="range"
                  min={trait.min}
                  max={trait.max}
                  step={trait.step}
                  value={traits[trait.key]}
                  onChange={(e) => setTraits({ ...traits, [trait.key]: Number(e.target.value) })}
                />
              </div>
            ))}

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-ghost-white">Temperature</span>
                <span className="text-sm font-mono text-soul-purple">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* STEP 3: Custom Touch */}
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-bold text-ghost-white">STEP 3: Custom Touch</h2>
        <p className="mb-4 text-sm text-astral-gray">Describe the unique twist you want to add</p>

        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Talks like a crypto degen but unexpectedly drops profound wisdom..."
          rows={3}
          className="w-full rounded-lg border border-astral-border bg-dark-nebula px-4 py-3 text-ghost-white placeholder:text-void-gray focus:border-soul-purple focus:outline-none focus:ring-1 focus:ring-soul-purple/30"
        />

        <div className="mt-3 flex flex-col gap-1 text-xs text-nebula-gray">
          <span>Examples:</span>
          <span>&bull; &ldquo;Speaks like a disappointed Asian dad giving life advice&rdquo;</span>
          <span>&bull; &ldquo;Mix of Socrates and Twitter shitposter&rdquo;</span>
          <span>&bull; &ldquo;Therapist energy but brutally honest&rdquo;</span>
        </div>
      </section>

      {/* STEP 4: Preview & Confirm */}
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-bold text-ghost-white">STEP 4: Preview &amp; Confirm</h2>

        <div className="rounded-xl border border-astral-border bg-void-surface p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-astral-gray">Soul Name</label>
              <input
                type="text"
                value={forkName}
                onChange={(e) => setForkName(e.target.value)}
                placeholder="e.g. Degen Philosopher"
                className="rounded-lg border border-astral-border bg-dark-nebula px-3 py-2.5 text-ghost-white placeholder:text-void-gray focus:border-soul-purple focus:outline-none focus:ring-1 focus:ring-soul-purple/30"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-astral-gray">Selling Price (MON)</label>
              <input
                type="number"
                value={forkPrice}
                onChange={(e) => setForkPrice(Number(e.target.value))}
                min={1}
                className="rounded-lg border border-astral-border bg-dark-nebula px-3 py-2.5 text-ghost-white focus:border-soul-purple focus:outline-none focus:ring-1 focus:ring-soul-purple/30"
              />
            </div>

            <div className="rounded-lg bg-dark-nebula p-4 text-sm">
              <h4 className="mb-2 font-semibold text-ghost-white">Cost Summary</h4>
              <div className="flex flex-col gap-1 text-astral-gray">
                <div className="flex justify-between">
                  <span>Fork Fee (10%)</span>
                  <span className="text-ghost-white">~5.00 MON</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas (estimated)</span>
                  <span className="text-ghost-white">~0.01 MON</span>
                </div>
                <div className="mt-1 border-t border-astral-border pt-1 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-soul-purple">~5.01 MON</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isConnected ? (
          <div className="mt-6 flex justify-center">
            <ConnectButton />
          </div>
        ) : (
          <button
            onClick={handleFork}
            disabled={isLoading || !forkName || !address}
            className="mt-6 w-full rounded-lg gradient-button py-3.5 font-semibold text-ghost-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] transition-all hover:shadow-[0_4px_20px_rgba(168,85,247,0.6)] active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? 'Creating Fork...' : `Fork & Mint (~5.01 MON)`}
          </button>
        )}
      </section>
    </div>
  )
}
