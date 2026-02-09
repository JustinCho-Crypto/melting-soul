'use client'

import type { Soul } from '@/lib/supabase'
import { shortenAddress } from '@/lib/utils'

interface Props {
  soul: Soul
  onClick?: () => void
}

export function SoulCard({ soul, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/10"
    >
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-white/5">
        <div className="flex h-full items-center justify-center text-4xl">
          🔮
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-3">
        <h3 className="truncate font-semibold text-white">{soul.name}</h3>
        <p className="line-clamp-2 text-sm text-white/50">{soul.description}</p>

        <div className="flex items-center justify-between text-xs text-white/40">
          <span className="rounded-full bg-white/10 px-2 py-0.5">{soul.conversation_style}</span>
          <span>Gen {soul.generation}</span>
        </div>

        <div className="text-xs text-white/30">
          {shortenAddress(soul.creator_address)}
        </div>
      </div>
    </div>
  )
}
