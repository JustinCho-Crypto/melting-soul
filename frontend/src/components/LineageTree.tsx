'use client'

import { useMemo, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  type NodeMouseHandler,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useLineage } from '@/hooks/useLineage'
import type { Soul } from '@/lib/supabase'

interface Props {
  tokenId: number
  onNodeClick: (soul: Soul) => void
}

export function LineageTree({ tokenId, onNodeClick }: Props) {
  const { data: lineage, isLoading } = useLineage(tokenId)

  const { nodes, edges } = useMemo(() => {
    if (!lineage || lineage.length === 0) return { nodes: [], edges: [] }

    // Group by generation for layout
    const byGen: Record<number, Soul[]> = {}
    for (const soul of lineage) {
      const gen = soul.generation
      if (!byGen[gen]) byGen[gen] = []
      byGen[gen].push(soul)
    }

    const nodes: Node[] = lineage.map((soul: Soul) => {
      const genSouls = byGen[soul.generation]
      const indexInGen = genSouls.indexOf(soul)
      const totalInGen = genSouls.length

      return {
        id: soul.id,
        position: {
          x: (indexInGen - (totalInGen - 1) / 2) * 220,
          y: soul.generation * 160,
        },
        data: {
          label: (
            <div className="flex flex-col items-center gap-1 px-2 py-1">
              <span className="text-lg">🔮</span>
              <span className="text-xs font-semibold">{soul.name}</span>
              <span className="text-[10px] opacity-60">Gen {soul.generation}</span>
            </div>
          ),
          soul,
        },
        style: {
          background: soul.generation === 0 ? '#1a1a2e' : '#16213e',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px',
          color: '#fff',
          width: 180,
        },
      }
    })

    const edges: Edge[] = lineage
      .filter((s: Soul) => s.parent_id)
      .map((soul: Soul) => ({
        id: `${soul.parent_id}-${soul.id}`,
        source: soul.parent_id!,
        target: soul.id,
        style: { stroke: 'rgba(255,255,255,0.2)' },
        animated: true,
      }))

    return { nodes, edges }
  }, [lineage])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      onNodeClick(node.data.soul)
    },
    [onNodeClick]
  )

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center text-white/50">
        Loading lineage tree...
      </div>
    )
  }

  if (!lineage || lineage.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center text-white/50">
        No lineage data found
      </div>
    )
  }

  return (
    <div className="h-[600px] w-full rounded-xl border border-white/10">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls className="!bg-zinc-800 !border-white/10 [&>button]:!bg-zinc-800 [&>button]:!border-white/10 [&>button]:!text-white" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
      </ReactFlow>
    </div>
  )
}
