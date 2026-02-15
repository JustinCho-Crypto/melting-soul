'use client'

import { useRouter } from 'next/navigation'
import { useSoulStats } from '@/hooks/useSouls'
import { shortenAddress, formatPrice } from '@/lib/utils'

export function SoulTable() {
  const router = useRouter()
  const { data: souls, isLoading } = useSoulStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/50">
        Loading...
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 text-left text-sm text-white/50">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium text-right">Floor</th>
            <th className="px-4 py-3 font-medium text-right">Volume</th>
            <th className="px-4 py-3 font-medium text-right">Forks</th>
            <th className="px-4 py-3 font-medium text-right">Sales</th>
          </tr>
        </thead>
        <tbody>
          {souls?.map((soul, i) => (
            <tr
              key={soul.id}
              onClick={() => router.push(`/lineage/${soul.token_id}`)}
              className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5"
            >
              <td className="px-4 py-4 text-white/50">{i + 1}</td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg">
                    🔮
                  </div>
                  <div>
                    <div className="font-medium text-white">{soul.name}</div>
                    <div className="text-xs text-white/40">{shortenAddress(soul.creator_address)}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-right text-white">
                {soul.floor_price ? `${formatPrice(soul.floor_price)} aUSD` : '-'}
              </td>
              <td className="px-4 py-4 text-right text-white">
                {formatPrice(soul.total_volume)} aUSD
              </td>
              <td className="px-4 py-4 text-right text-white/70">{soul.fork_count}</td>
              <td className="px-4 py-4 text-right text-white/70">{soul.sale_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
