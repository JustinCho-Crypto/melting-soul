'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useSouls } from '@/hooks/useSouls'
import { SoulCard } from '@/components/SoulCard'
import { SoulModal } from '@/components/SoulModal'
import { ForkModal } from '@/components/ForkModal'
import type { Soul } from '@/lib/supabase'

export default function MySoulsPage() {
  const { address, isConnected } = useAccount()
  const { data: allSouls, isLoading } = useSouls()

  const [selectedSoul, setSelectedSoul] = useState<Soul | null>(null)
  const [forkTarget, setForkTarget] = useState<Soul | null>(null)

  // TODO: Filter by actual on-chain balance instead of creator_address
  const mySouls = allSouls?.filter(
    (s) => address && s.creator_address.toLowerCase() === address.toLowerCase()
  )

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
        <span className="text-4xl">🔮</span>
        <h2 className="text-xl font-bold text-white">Connect your wallet</h2>
        <p className="text-white/50">Connect your wallet to view your Souls</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white/50">
        Loading...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-col gap-2 pb-6">
        <h1 className="text-3xl font-bold text-white">My Souls</h1>
        <p className="text-white/50">Souls you own or created</p>
      </div>

      {mySouls && mySouls.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mySouls.map((soul) => (
            <SoulCard
              key={soul.id}
              soul={soul}
              onClick={() => setSelectedSoul(soul)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-white/10 py-20">
          <span className="text-4xl">👻</span>
          <p className="text-white/50">No souls found. Go collect some!</p>
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
