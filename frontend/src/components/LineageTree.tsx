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
  currentSoulId?: string
  onNodeClick: (soul: Soul) => void
}

function getNodeStyle(generation: number) {
  if (generation === 0) {
    return {
      background: '#16141F',
      border: '2px solid #F59E0B',
      borderRadius: '12px',
      color: '#F8FAFC',
      width: 180,
      boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)',
    }
  }
  if (generation === 1) {
    return {
      background: '#16141F',
      border: '2px solid #A855F7',
      borderRadius: '12px',
      color: '#F8FAFC',
      width: 180,
      boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)',
    }
  }
  return {
    background: '#16141F',
    border: '2px solid #EC4899',
    borderRadius: '12px',
    color: '#F8FAFC',
    width: 180,
    boxShadow: '0 0 15px rgba(236, 72, 153, 0.3)',
  }
}

function getGenBadgeColor(generation: number) {
  if (generation === 0) return '#F59E0B'
  if (generation === 1) return '#A855F7'
  return '#EC4899'
}

export function LineageTree({ tokenId, onNodeClick }: Props) {
  const { data: lineage, isLoading } = useLineage(tokenId)

  const { nodes, edges } = useMemo(() => {
    if (!lineage || lineage.length === 0) return { nodes: [], edges: [] }

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
      const badgeColor = getGenBadgeColor(soul.generation)

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
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                style={{ backgroundColor: `${badgeColor}33`, color: badgeColor }}
              >
                Gen {soul.generation}{soul.generation === 0 ? ' · Origin' : ''}
              </span>
            </div>
          ),
          soul,
        },
        style: getNodeStyle(soul.generation),
      }
    })

    const edges: Edge[] = lineage
      .filter((s: Soul) => s.parent_id)
      .map((soul: Soul) => ({
        id: `${soul.parent_id}-${soul.id}`,
        source: soul.parent_id!,
        target: soul.id,
        style: { stroke: '#A855F7', strokeWidth: 2 },
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
      <div className="flex h-[600px] items-center justify-center text-astral-gray">
        Loading lineage tree...
      </div>
    )
  }

  if (!lineage || lineage.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center text-astral-gray">
        No lineage data found
      </div>
    )
  }

  return (
    <div className="h-[600px] w-full rounded-xl border border-astral-border bg-dark-nebula">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls className="!bg-void-surface !border-astral-border [&>button]:!bg-void-surface [&>button]:!border-astral-border [&>button]:!text-ghost-white" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(168, 85, 247, 0.05)" />
      </ReactFlow>
    </div>
  )
}
