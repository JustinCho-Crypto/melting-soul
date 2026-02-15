'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useBuySoul, useBuyWithAusd, useBuyWithDiscountToken } from '@/hooks/useContracts'
import { useListingBySoul } from '@/hooks/useListings'
import { shortenAddress, formatPrice } from '@/lib/utils'
import { DISCOUNT_BPS } from '@/lib/contracts'
import { GenBadge } from '@/components/GenBadge'
import { PersonalityTraits } from '@/components/PersonalityTraits'
import { LineageTree } from '@/components/LineageTree'
import { MOCK_SOUL_STATS, MOCK_ACTIVITY } from '@/lib/mockData'
import type { Soul } from '@/lib/types'

interface Props {
  soul: Soul
  onClose: () => void
  onFork: () => void
}

type Tab = 'overview' | 'lineage' | 'activity'
type PaymentMethod = 'ausd' | 'mon' | 'mst'

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

function getDiscountedPrice(price: number): number {
  return price - (price * DISCOUNT_BPS) / 10000
}

function getDiscountPercent(): number {
  return DISCOUNT_BPS / 100
}

export function SoulModal({ soul, onClose, onFork }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { address } = useAccount()
  const { buy, isLoading: isBuyLoading } = useBuySoul()
  const { buyWithAusd, isLoading: isAusdLoading } = useBuyWithAusd()
  const { buyWithDiscountToken, isLoading: isDiscountLoading } = useBuyWithDiscountToken()
  const { data: listing } = useListingBySoul(soul.id)

  const isLoading = isBuyLoading || isAusdLoading || isDiscountLoading

  const stats = MOCK_SOUL_STATS.find((s) => s.id === soul.id)
  const activities = MOCK_ACTIVITY.filter((a) => a.soul_id === soul.id)

  const handleBuy = async (method: PaymentMethod) => {
    if (!listing) return
    switch (method) {
      case 'ausd':
        await buyWithAusd(listing.listing_id, 1)
        break
      case 'mon':
        await buy(listing.listing_id, 1)
        break
      case 'mst':
        await buyWithDiscountToken(listing.listing_id, 1)
        break
    }
    onClose()
  }

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
              isLoading={isLoading}
              address={address}
              onBuy={handleBuy}
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

function PaymentSelector({
  listing,
  selectedMethod,
  onSelect,
}: {
  listing: { price: string }
  selectedMethod: PaymentMethod
  onSelect: (method: PaymentMethod) => void
}) {
  const fullPrice = Number(listing.price)
  const discountedPrice = getDiscountedPrice(fullPrice)
  const discountPercent = getDiscountPercent()

  const methods: {
    key: PaymentMethod
    label: string
    symbol: string
    price: number
    tag?: string
    tagColor?: string
  }[] = [
    {
      key: 'ausd',
      label: 'AUSD',
      symbol: 'Stablecoin',
      price: fullPrice,
    },
    {
      key: 'mon',
      label: 'MON',
      symbol: 'Native Token',
      price: fullPrice,
    },
    {
      key: 'mst',
      label: 'MST',
      symbol: 'Soul Token',
      price: discountedPrice,
      tag: `${discountPercent}% OFF`,
      tagColor: 'bg-emerald-500/20 text-emerald-400',
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-nebula-gray">
        Payment Method
      </span>
      <div className="flex flex-col gap-2">
        {methods.map((m) => (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
              selectedMethod === m.key
                ? 'border-soul-purple bg-soul-purple/10'
                : 'border-astral-border bg-void-surface hover:border-astral-gray'
            }`}
          >
            {/* Radio indicator */}
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                selectedMethod === m.key
                  ? 'border-soul-purple'
                  : 'border-nebula-gray'
              }`}
            >
              {selectedMethod === m.key && (
                <div className="h-2 w-2 rounded-full bg-soul-purple" />
              )}
            </div>

            {/* Token info */}
            <div className="flex flex-1 items-center gap-2">
              <span className="font-semibold text-ghost-white">{m.label}</span>
              <span className="text-xs text-nebula-gray">{m.symbol}</span>
              {m.tag && (
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${m.tagColor}`}>
                  {m.tag}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="text-right">
              <span
                className={`font-mono text-sm font-semibold ${
                  m.key === 'mst' ? 'text-emerald-400' : 'text-ghost-white'
                }`}
              >
                {formatPrice(m.price)} {m.label}
              </span>
              {m.key === 'mst' && (
                <div className="font-mono text-[10px] text-nebula-gray line-through">
                  {formatPrice(fullPrice)} {m.label}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function OverviewTab({
  soul,
  listing,
  stats,
  isLoading,
  address,
  onBuy,
  onFork,
}: {
  soul: Soul
  listing: ReturnType<typeof useListingBySoul>['data']
  stats: (typeof MOCK_SOUL_STATS)[number] | undefined
  isLoading: boolean
  address: string | undefined
  onBuy: (method: PaymentMethod) => void
  onFork: () => void
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ausd')

  const getBuyButtonLabel = () => {
    if (isLoading) return 'Processing...'
    if (!listing) return 'Not Listed'

    const fullPrice = Number(listing.price)
    const price = paymentMethod === 'mst' ? getDiscountedPrice(fullPrice) : fullPrice
    const symbol = paymentMethod === 'ausd' ? 'AUSD' : paymentMethod === 'mon' ? 'MON' : 'MST'

    return `Buy \u00B7 ${formatPrice(price)} ${symbol}`
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
          { label: 'Price', value: listing ? `${formatPrice(listing.price)} AUSD` : '-' },
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

      {/* Payment Method Selector */}
      {listing && (
        <PaymentSelector
          listing={listing}
          selectedMethod={paymentMethod}
          onSelect={setPaymentMethod}
        />
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {listing && (
            <button
              onClick={() => onBuy(paymentMethod)}
              disabled={isLoading || !address}
              className={`flex-1 rounded-lg py-3 font-semibold text-ghost-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] transition-all hover:shadow-[0_4px_20px_rgba(168,85,247,0.6)] active:scale-[0.98] disabled:opacity-50 ${
                paymentMethod === 'mst'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-[0_4px_14px_rgba(16,185,129,0.4)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.6)]'
                  : 'gradient-button'
              }`}
            >
              {getBuyButtonLabel()}
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
        <p className="text-center text-xs text-nebula-gray">
          2.5% fee on all purchases &middot; Royalties flow to origin creator
          {paymentMethod === 'mst' && (
            <span className="text-emerald-400"> &middot; {getDiscountPercent()}% discount with MST</span>
          )}
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
