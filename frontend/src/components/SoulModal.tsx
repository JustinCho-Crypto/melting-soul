'use client'

import { useAccount } from 'wagmi'
import { useBuySoul } from '@/hooks/useContracts'
import { useListingBySoul } from '@/hooks/useListings'
import { shortenAddress, formatPrice } from '@/lib/utils'
import type { Soul } from '@/lib/supabase'

interface Props {
  soul: Soul
  onClose: () => void
  onFork: () => void
}

function GenBadge({ generation }: { generation: number }) {
  if (generation === 0) {
    return (
      <span className="rounded-full bg-astral-amber/20 px-2.5 py-1 text-xs font-semibold text-astral-amber">
        Origin
      </span>
    )
  }
  if (generation === 1) {
    return (
      <span className="rounded-full bg-ethereal-blue/20 px-2.5 py-1 text-xs font-semibold text-ethereal-blue">
        Gen {generation}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-plasma-pink/20 px-2.5 py-1 text-xs font-semibold text-plasma-pink">
      Gen {generation}
    </span>
  )
}

export function SoulModal({ soul, onClose, onFork }: Props) {
  const { address } = useAccount()
  const { buy, isLoading } = useBuySoul()
  const { data: listing } = useListingBySoul(soul.id)

  const handleBuy = async () => {
    if (!listing) return
    await buy(listing.listing_id, 1)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl border border-astral-border bg-dark-nebula p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-nebula-gray transition-colors hover:text-ghost-white"
        >
          ✕
        </button>

        <div className="soul-glow mx-auto flex h-28 w-28 items-center justify-center rounded-xl bg-cosmic-dark text-6xl">
          🔮
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold text-ghost-white">{soul.name}</h2>
          <GenBadge generation={soul.generation} />
          <p className="mt-1 text-center text-sm text-astral-gray">{soul.description}</p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 rounded-xl bg-void-surface p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-nebula-gray">Style</span>
            <span className="text-ghost-white">{soul.conversation_style}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nebula-gray">Domain</span>
            <span className="text-ghost-white">{soul.knowledge_domain?.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nebula-gray">Generation</span>
            <span className="text-ghost-white">{soul.generation} {soul.generation === 0 ? '(Origin)' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nebula-gray">Creator</span>
            <span className="font-mono text-xs text-ghost-white">{shortenAddress(soul.creator_address)}</span>
          </div>
        </div>

        {listing && (
          <div className="mt-4 rounded-xl border border-astral-border bg-void-surface p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-soul-purple">{formatPrice(listing.price)} MON</span>
              <span className="text-sm text-nebula-gray">{listing.remaining_amount} left</span>
            </div>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          {listing && (
            <button
              onClick={handleBuy}
              disabled={isLoading || !address}
              className="flex-1 rounded-lg gradient-button py-3 font-semibold text-ghost-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] transition-all hover:shadow-[0_4px_20px_rgba(168,85,247,0.6)] active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Buy'}
            </button>
          )}
          <button
            onClick={onFork}
            disabled={!address}
            className="flex-1 rounded-lg border border-soul-purple py-3 font-semibold text-soul-purple transition-all hover:bg-soul-purple/10 active:scale-[0.98] disabled:opacity-50"
          >
            Fork
          </button>
        </div>
      </div>
    </div>
  )
}
