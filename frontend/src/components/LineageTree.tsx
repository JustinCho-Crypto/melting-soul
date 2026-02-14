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
import type { Soul } from '@/lib/types'

interface Props {
  tokenId: number
  currentSoulId?: string
  onNodeClick: (soul: Soul) => void
}

function isVisible(soul: Soul, currentSoulId?: string): boolean {
  if (!currentSoulId) return true
  return soul.generation === 0 || soul.id === currentSoulId
}

function getNodeStyle(soul: Soul, currentSoulId?: string) {
  const visible = isVisible(soul, currentSoulId)
  const isCurrent = currentSoulId === soul.id

  if (!visible) {
    return {
      background: '#1E1B2E',
      border: '1px solid #2E2B3B',
      borderRadius: '12px',
      color: '#6B7280',
      width: 180,
    }
  }

  if (isCurrent) {
    return {
      background: '#16141F',
      border: '3px solid #A855F7',
      borderRadius: '12px',
      color: '#F8FAFC',
      width: 180,
      boxShadow: '0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.2)',
    }
  }

  if (soul.generation === 0) {
    return {
      background: '#16141F',
      border: '2px solid #F59E0B',
      borderRadius: '12px',
      color: '#F8FAFC',
      width: 180,
      boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)',
    }
  }

  if (soul.generation === 1) {
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

function getEdgeStyle(sourceSoul: Soul | undefined, targetSoul: Soul, currentSoulId?: string) {
  if (!currentSoulId) {
    return { style: { stroke: '#A855F7', strokeWidth: 2 }, animated: true }
  }

  const sourceVisible = sourceSoul ? isVisible(sourceSoul, currentSoulId) : true
  const targetVisible = isVisible(targetSoul, currentSoulId)

  if (sourceVisible && targetVisible) {
    return { style: { stroke: '#A855F7', strokeWidth: 3 }, animated: true }
  }
  if (sourceVisible && !targetVisible) {
    return {
      style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '8 4' },
      animated: false,
    }
  }
  return {
    style: { stroke: '#2E2B3B', strokeWidth: 1, strokeDasharray: '2 4' },
    animated: false,
  }
}

export function LineageTree({ tokenId, currentSoulId, onNodeClick }: Props) {
  const { data: lineage, isLoading } = useLineage(tokenId)

  const { nodes, edges, stats } = useMemo(() => {
    if (!lineage || lineage.length === 0) return { nodes: [], edges: [], stats: null }

    const soulMap = new Map<string, Soul>()
    const byGen: Record<number, Soul[]> = {}
    let deepestGen = 0
    for (const soul of lineage) {
      soulMap.set(soul.id, soul)
      const gen = soul.generation
      if (!byGen[gen]) byGen[gen] = []
      byGen[gen].push(soul)
      if (gen > deepestGen) deepestGen = gen
    }

    const nodes: Node[] = lineage.map((soul: Soul) => {
      const genSouls = byGen[soul.generation]
      const indexInGen = genSouls.indexOf(soul)
      const totalInGen = genSouls.length
      const visible = isVisible(soul, currentSoulId)
      const isCurrent = currentSoulId === soul.id
      const badgeColor = getGenBadgeColor(soul.generation)

      return {
        id: soul.id,
        position: {
          x: (indexInGen - (totalInGen - 1) / 2) * 220,
          y: soul.generation * 160,
        },
        data: {
          label: visible ? (
            <div className="flex flex-col items-center gap-1 px-2 py-1">
              <span className="text-lg">🔮</span>
              <span className="text-xs font-semibold">{soul.name}</span>
              <div className="flex items-center gap-1">
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ backgroundColor: `${badgeColor}33`, color: badgeColor }}
                >
                  Gen {soul.generation}{soul.generation === 0 ? ' · Origin' : ''}
                </span>
                {isCurrent && (
                  <span className="rounded-full bg-soul-purple/30 px-1.5 py-0.5 text-[9px] font-bold text-soul-purple">
                    ◆ CURRENT
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 px-2 py-1 group">
              <span className="text-lg opacity-40">?</span>
              <span className="text-[10px] text-gray-500">Gen {soul.generation} · Hidden Soul</span>
              <span className="text-[9px] text-soul-purple/0 group-hover:text-soul-purple/80 transition-colors">
                Buy to Reveal
              </span>
            </div>
          ),
          soul,
        },
        style: getNodeStyle(soul, currentSoulId),
      }
    })

    const edges: Edge[] = lineage
      .filter((s: Soul) => s.parent_id)
      .map((soul: Soul) => {
        const parentSoul = soulMap.get(soul.parent_id!)
        const edgeProps = getEdgeStyle(parentSoul, soul, currentSoulId)
        return {
          id: `${soul.parent_id}-${soul.id}`,
          source: soul.parent_id!,
          target: soul.id,
          ...edgeProps,
        }
      })

    const stats = currentSoulId ? {
      totalSouls: lineage.length,
      deepestGen,
      totalSales: lineage.length * 3,
    } : null

    return { nodes, edges, stats }
  }, [lineage, currentSoulId])

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      onNodeClick(node.data.soul)
    },
    [onNodeClick]
  )

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center text-astral-gray">
        Loading lineage tree...
      </div>
    )
  }

  if (!lineage || lineage.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center text-astral-gray">
        No lineage data found
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="flex-1 min-h-0 rounded-xl border border-astral-border bg-dark-nebula">
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

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Souls in Tree', value: stats.totalSouls },
            { label: 'Deepest Generation', value: `Gen ${stats.deepestGen}` },
            { label: 'Total Sales', value: stats.totalSales },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 rounded-lg bg-void-surface p-3">
              <span className="text-sm font-bold text-ghost-white">{s.value}</span>
              <span className="text-[10px] text-nebula-gray">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
