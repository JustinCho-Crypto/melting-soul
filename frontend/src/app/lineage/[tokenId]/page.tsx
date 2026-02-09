'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { LineageTree } from '@/components/LineageTree'
import { SoulModal } from '@/components/SoulModal'
import { ForkModal } from '@/components/ForkModal'
import { useSoul } from '@/hooks/useSoul'
import type { Soul } from '@/lib/supabase'

export default function LineagePage() {
  const params = useParams()
  const tokenId = Number(params.tokenId)
  const { data: soul } = useSoul(tokenId)

  const [selectedSoul, setSelectedSoul] = useState<Soul | null>(null)
  const [forkTarget, setForkTarget] = useState<Soul | null>(null)

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-col gap-2 pb-6">
        <h1 className="text-3xl font-bold text-white">
          {soul?.name ?? 'Soul'} Lineage
        </h1>
        <p className="text-white/50">
          Explore the fork tree. Click a node to view details.
        </p>
      </div>

      <LineageTree
        tokenId={tokenId}
        onNodeClick={(soul) => setSelectedSoul(soul)}
      />

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
