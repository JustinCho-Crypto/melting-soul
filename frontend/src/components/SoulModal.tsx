'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useBuyWithAusd, useBuyWithSoul, useApproveToken, useOnChainListing } from '@/hooks/useContracts'
import { useSoulTokenPrice } from '@/hooks/useSoulPrice'
import { useListingBySoul } from '@/hooks/useListings'
import { shortenAddress, formatPrice } from '@/lib/utils'
import { GenBadge } from '@/components/GenBadge'
import { PersonalityTraits } from '@/components/PersonalityTraits'
import { LineageTree } from '@/components/LineageTree'
import { MOCK_SOUL_STATS, MOCK_ACTIVITY } from '@/lib/mockData'
import { SOUL_SALE_ADDRESS, AUSD_TOKEN_ADDRESS, DISCOUNT_TOKEN_ADDRESS } from '@/lib/contracts'
import type { Soul } from '@/lib/types'

interface Props {
  soul: Soul
  onClose: () => void
  onFork: () => void
}

type Tab = 'overview' | 'lineage' | 'activity'
type PaymentToken = 'aUSD' | 'SOUL'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'lineage', label: 'Lineage' },
  { key: 'activity', label: 'Activity' },
]

function formatRelativeTime(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const EVENT_ICONS: Record<string, string> = {
  fork: '\u{1F500}',
  sold: '\u{1F6D2}',
  created: '\u2B50',
}

export function SoulModal({ soul, onClose, onFork }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { address } = useAccount()
  const { data: listing } = useListingBySoul(soul.id)

  const stats = MOCK_SOUL_STATS.find((s) => s.id === soul.id)
  const activities = MOCK_ACTIVITY.filter((a) => a.soul_id === soul.id)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-astral-border bg-dark-nebula"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-nebula-gray transition-colors hover:text-ghost-white"
        >
          ✕
        </button>

        {/* Tab bar */}
        <div className="flex border-b border-astral-border px-6 pt-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-soul-purple'
                  : 'text-nebula-gray hover:text-ghost-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-soul-purple" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              soul={soul}
              listing={listing}
              stats={stats}
              address={address}
              onClose={onClose}
              onFork={onFork}
            />
          )}
          {activeTab === 'lineage' && (
            <div className="h-[400px]">
              <LineageTree
                tokenId={soul.token_id}
                currentSoulId={soul.id}
                onNodeClick={() => {}}
              />
            </div>
          )}
          {activeTab === 'activity' && (
            <ActivityTab activities={activities} />
          )}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({
  soul,
  listing,
  stats,
  address,
  onClose,
  onFork,
}: {
  soul: Soul
  listing: ReturnType<typeof useListingBySoul>['data']
  stats: (typeof MOCK_SOUL_STATS)[number] | undefined
  address: string | undefined
  onClose: () => void
  onFork: () => void
}) {
  const [selectedToken, setSelectedToken] = useState<PaymentToken>('aUSD')

  const buyAusd = useBuyWithAusd()
  const buySoul = useBuyWithSoul()
  const { approve, isLoading: isApproving } = useApproveToken()
  const soulPrice = useSoulTokenPrice()
  // Read price from on-chain contract (source of truth)
  const { data: onChainListing } = useOnChainListing(listing?.listing_id)

  const isLoading = buyAusd.isLoading || buySoul.isLoading || isApproving

  const getDisplayPrice = () => {
    if (!onChainListing) return '-'
    const price = formatPrice(onChainListing.pricePerUnit.toString(), 6)
    if (selectedToken === 'SOUL') {
      const discountedWei = onChainListing.pricePerUnit * BigInt(8000) / BigInt(10000)
      return `${formatPrice(discountedWei.toString(), 6)} $SOUL`
    }
    return `${price} aUSD`
  }

  const getSoulTokenAmount = () => {
    if (!onChainListing || !soulPrice) return null
    // Convert wei (6 decimals) to human-readable, then apply 20% discount
    const priceHuman = Number(onChainListing.pricePerUnit) / 1e6
    const discountedAusd = priceHuman * 0.8
    const soulTokens = discountedAusd / soulPrice.priceInMon
    return soulTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  const getBuyLabel = () => {
    if (isLoading) return 'Processing...'
    if (selectedToken === 'SOUL') return `Buy \u00b7 ${getDisplayPrice()} (20% OFF)`
    return `Buy \u00b7 ${getDisplayPrice()}`
  }

  const handleBuy = async () => {
    if (!listing || !SOUL_SALE_ADDRESS || !onChainListing) return

    try {
      // Price from on-chain contract (source of truth)
      const priceWei = onChainListing.pricePerUnit

      if (selectedToken === 'aUSD') {
        if (!AUSD_TOKEN_ADDRESS) return
        // 1) Approve — waits for on-chain confirmation
        await approve(AUSD_TOKEN_ADDRESS, SOUL_SALE_ADDRESS, priceWei)
        // 2) Buy — only fires after approve is confirmed
        await buyAusd.buy(listing.listing_id, 1)
      } else if (selectedToken === 'SOUL') {
        if (!DISCOUNT_TOKEN_ADDRESS) return
        const discountedPrice = priceWei * BigInt(8000) / BigInt(10000)
        await approve(DISCOUNT_TOKEN_ADDRESS, SOUL_SALE_ADDRESS, discountedPrice)
        await buySoul.buy(listing.listing_id, 1)
      }

      onClose()
    } catch (err) {
      console.error('Buy failed:', err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header: Avatar + Info */}
      <div className="flex gap-6">
        <div className="soul-glow flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-cosmic-dark text-6xl">
          🔮
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ghost-white">{soul.name}</h2>
            <GenBadge generation={soul.generation} size="md" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md bg-soul-purple/15 px-2 py-0.5 text-xs text-soul-purple">
              {soul.conversation_style}
            </span>
            {soul.knowledge_domain?.map((d) => (
              <span key={d} className="rounded-md bg-cosmic-dark px-2 py-0.5 text-xs text-nebula-gray">
                #{d}
              </span>
            ))}
          </div>
          <p className="text-sm text-astral-gray">{soul.description}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Forked', value: stats?.fork_count ?? 0 },
          { label: 'Sold', value: stats?.sale_count ?? 0 },
          { label: 'Lineage', value: `Gen ${soul.generation}` },
          { label: 'Price', value: onChainListing ? `${formatPrice(onChainListing.pricePerUnit.toString(), 6)} aUSD` : '-' },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1 rounded-lg bg-void-surface p-3">
            <span className="text-lg font-bold text-ghost-white">{stat.value}</span>
            <span className="text-xs text-nebula-gray">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Personality Traits */}
      {soul.behavior_traits && soul.behavior_traits.length > 0 && (
        <div className="rounded-xl border border-astral-border bg-void-surface p-4">
          <PersonalityTraits traits={soul.behavior_traits} temperature={soul.temperature} />
        </div>
      )}

      {/* Creator info */}
      <div className="flex items-center gap-3 rounded-xl bg-void-surface p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cosmic-dark text-lg">
          👤
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-sm text-ghost-white">{shortenAddress(soul.creator_address)}</span>
          {soul.generation === 0 && (
            <span className="text-xs text-astral-amber">Origin Creator</span>
          )}
        </div>
      </div>

      {/* Token Selection */}
      {listing && (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-nebula-gray">Pay with</span>
          <div className="grid grid-cols-2 gap-2">
            {([
              { token: 'aUSD' as PaymentToken, label: 'aUSD', sub: 'Stablecoin' },
              { token: 'SOUL' as PaymentToken, label: '$SOUL', sub: '20% OFF' },
            ]).map(({ token, label, sub }) => (
              <button
                key={token}
                onClick={() => setSelectedToken(token)}
                className={`flex flex-col items-center gap-0.5 rounded-lg border p-3 transition-all ${
                  selectedToken === token
                    ? 'border-soul-purple bg-soul-purple/10 text-ghost-white'
                    : 'border-astral-border bg-void-surface text-nebula-gray hover:border-soul-purple/50'
                }`}
              >
                <span className="text-sm font-semibold">{label}</span>
                <span className={`text-xs ${token === 'SOUL' ? 'text-green-400' : 'text-astral-gray'}`}>{sub}</span>
              </button>
            ))}
          </div>
          {selectedToken === 'SOUL' && (
            <div className="rounded-lg bg-green-400/5 border border-green-400/20 p-3">
              <p className="text-xs text-green-400">
                Hold $SOUL tokens to get 20% off all purchases!
              </p>
              {soulPrice && (
                <p className="mt-1 text-xs text-astral-gray">
                  1 $SOUL = {soulPrice.priceInMon.toFixed(6)} MON
                  {getSoulTokenAmount() && (
                    <span className="text-nebula-gray"> &middot; ~{getSoulTokenAmount()} $SOUL needed</span>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {listing && (
            <button
              onClick={handleBuy}
              disabled={isLoading || !address}
              className="flex-1 rounded-lg gradient-button py-3 font-semibold text-ghost-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] transition-all hover:shadow-[0_4px_20px_rgba(168,85,247,0.6)] active:scale-[0.98] disabled:opacity-50"
            >
              {getBuyLabel()}
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
        <a
          href={`/api/souls/${soul.token_id}?format=txt`}
          download
          className="rounded-lg border border-astral-border py-2.5 text-center text-sm font-medium text-nebula-gray transition-all hover:border-ghost-white hover:text-ghost-white active:scale-[0.98]"
        >
          Export soul.txt
        </a>
        <p className="text-center text-xs text-nebula-gray">
          2.5% platform fee &middot; 4% origin royalty &middot; 3.5% parent royalty
        </p>
      </div>
    </div>
  )
}

function ActivityTab({ activities }: { activities: typeof MOCK_ACTIVITY }) {
  if (activities.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-astral-gray">
        No activity yet
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-4 rounded-xl bg-void-surface p-4 transition-colors hover:border-astral-border"
          >
            <span className="text-2xl">{EVENT_ICONS[event.type] ?? '?'}</span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-ghost-white">{event.detail}</span>
              <span className="font-mono text-xs text-nebula-gray">
                by {shortenAddress(event.actor_address)}
              </span>
            </div>
            <span className="text-xs text-astral-gray">{formatRelativeTime(event.timestamp)}</span>
          </div>
        ))}
    </div>
  )
}
