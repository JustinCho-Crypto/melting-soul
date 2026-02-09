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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/50 transition-colors hover:text-white"
        >
          ✕
        </button>

        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-xl bg-white/5 text-6xl">
          🔮
        </div>

        <h2 className="mt-4 text-center text-xl font-bold text-white">{soul.name}</h2>
        <p className="mt-2 text-center text-sm text-white/50">{soul.description}</p>

        <div className="mt-4 flex flex-col gap-2 rounded-lg bg-white/5 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Style</span>
            <span className="text-white">{soul.conversation_style}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Domain</span>
            <span className="text-white">{soul.knowledge_domain?.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Generation</span>
            <span className="text-white">{soul.generation} {soul.generation === 0 ? '(Origin)' : ''}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Creator</span>
            <span className="text-white">{shortenAddress(soul.creator_address)}</span>
          </div>
        </div>

        {listing && (
          <div className="mt-4 rounded-lg border border-white/10 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-white">{formatPrice(listing.price)} TOKEN</span>
              <span className="text-sm text-white/40">{listing.remaining_amount} remaining</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          {listing && (
            <button
              onClick={handleBuy}
              disabled={isLoading || !address}
              className="flex-1 rounded-lg bg-white py-3 font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Buy'}
            </button>
          )}
          <button
            onClick={onFork}
            disabled={!address}
            className="flex-1 rounded-lg border border-white/20 py-3 font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Fork
          </button>
        </div>
      </div>
    </div>
  )
}
