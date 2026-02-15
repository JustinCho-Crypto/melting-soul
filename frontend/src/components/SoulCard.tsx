'use client'

import type { Soul } from '@/lib/types'
import { GenBadge } from '@/components/GenBadge'

interface Props {
  soul: Soul
  onClick?: () => void
  onBuy?: () => void
  onFork?: () => void
  showActions?: boolean
}

export function SoulCard({ soul, onClick, onBuy, onFork, showActions = true }: Props) {
  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-astral-border bg-void-surface p-4 transition-all duration-300 hover:-translate-y-1 hover:border-soul-purple hover:[box-shadow:0_0_30px_rgba(168,85,247,0.3),0_8px_32px_rgba(0,0,0,0.4)]"
    >
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-cosmic-dark">
        <div className="text-5xl transition-transform duration-300 group-hover:scale-110">🔮</div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="truncate font-semibold text-ghost-white">{soul.name}</h3>
        <p className="line-clamp-2 text-sm text-astral-gray">{soul.description}</p>

        <div className="flex flex-wrap gap-1.5">
          {soul.knowledge_domain?.slice(0, 2).map((domain) => (
            <span
              key={domain}
              className="rounded-md bg-cosmic-dark px-2 py-0.5 text-[11px] text-nebula-gray"
            >
              #{domain}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <GenBadge generation={soul.generation} />
        </div>
      </div>

      {showActions && (onBuy || onFork) && (
        <div className="flex gap-2 pt-1">
          {onBuy && (
            <button
              onClick={(e) => { e.stopPropagation(); onBuy() }}
              className="flex-1 rounded-lg gradient-button py-2 text-xs font-semibold text-ghost-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] transition-all hover:shadow-[0_4px_20px_rgba(168,85,247,0.6)] active:scale-[0.98]"
            >
              Buy
            </button>
          )}
          {onFork && (
            <button
              onClick={(e) => { e.stopPropagation(); onFork() }}
              className="flex-1 rounded-lg border border-soul-purple py-2 text-xs font-semibold text-soul-purple transition-all hover:bg-soul-purple/10 active:scale-[0.98]"
            >
              Fork
            </button>
          )}
        </div>
      )}
    </div>
  )
}
