'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useAllSouls } from '@/hooks/useSouls'
import type { Soul } from '@/lib/types'

interface LineageGroup {
  origin: Soul
  forks: Soul[]
  totalDescendants: number
  maxGen: number
}

export default function LineageIndexPage() {
  const { data: allSouls, isLoading } = useAllSouls()

  const lineageGroups = useMemo(() => {
    if (!allSouls) return []

    const origins = allSouls.filter((s) => s.generation === 0)

    const groups: LineageGroup[] = origins
      .map((origin) => {
        const descendants = findAllDescendants(origin.id, allSouls)
        const maxGen = descendants.reduce((max, s) => Math.max(max, s.generation), 0)
        return {
          origin,
          forks: descendants.filter((s) => s.id !== origin.id),
          totalDescendants: descendants.length - 1,
          maxGen,
        }
      })
      .filter((g) => g.totalDescendants > 0)
      .sort((a, b) => b.totalDescendants - a.totalDescendants)

    return groups
  }, [allSouls])

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col gap-2 pb-8">
        <h1 className="text-3xl font-bold text-ghost-white">Lineage Explorer</h1>
        <p className="text-astral-gray">
          Trace the evolution of AI Souls through their fork trees
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center text-astral-gray">
          Loading...
        </div>
      ) : lineageGroups.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-astral-gray">
          <span className="text-5xl">🌳</span>
          <p>No lineage trees found yet</p>
          <Link
            href="/create"
            className="rounded-lg gradient-button px-6 py-2 text-sm font-semibold text-ghost-white"
          >
            Fork a Soul to Start
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {lineageGroups.map((group) => (
            <Link
              key={group.origin.id}
              href={`/lineage/${group.origin.token_id}`}
              className="group rounded-xl border border-astral-border bg-void-surface p-6 transition-all duration-300 hover:border-soul-purple hover:[box-shadow:0_0_30px_rgba(168,85,247,0.15)]"
            >
              <div className="flex items-center gap-5">
                {/* Origin Soul Icon */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-astral-amber bg-cosmic-dark text-3xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  🔮
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-ghost-white group-hover:text-soul-purple transition-colors">
                      {group.origin.name}
                    </h2>
                    <span className="rounded-full bg-astral-amber/15 px-2.5 py-0.5 text-xs font-semibold text-astral-amber">
                      Origin
                    </span>
                  </div>
                  <p className="text-sm text-nebula-gray line-clamp-1">
                    {group.origin.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-void-gray">
                    {group.origin.knowledge_domain.map((d) => (
                      <span key={d} className="text-astral-gray">#{d}</span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex shrink-0 items-center gap-6">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xl font-bold text-ghost-white">{group.totalDescendants}</span>
                    <span className="text-[10px] text-void-gray">Forks</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xl font-bold text-ghost-white">{group.maxGen}</span>
                    <span className="text-[10px] text-void-gray">Max Gen</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-astral-gray group-hover:text-soul-purple transition-colors">
                    View Tree
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Fork Preview */}
              {group.forks.length > 0 && (
                <div className="flex items-center gap-2 pt-4 mt-4 border-t border-astral-border/50">
                  <span className="text-xs text-void-gray">Forks:</span>
                  {group.forks.slice(0, 4).map((fork) => (
                    <span
                      key={fork.id}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        fork.generation === 1
                          ? 'bg-soul-purple/15 text-soul-purple'
                          : 'bg-pink-500/15 text-pink-400'
                      }`}
                    >
                      Gen{fork.generation} · {fork.name}
                    </span>
                  ))}
                  {group.forks.length > 4 && (
                    <span className="text-xs text-void-gray">+{group.forks.length - 4} more</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function findAllDescendants(originId: string, allSouls: Soul[]): Soul[] {
  const result: Soul[] = []
  const origin = allSouls.find((s) => s.id === originId)
  if (!origin) return result

  const queue = [origin]
  while (queue.length > 0) {
    const current = queue.shift()!
    result.push(current)
    const children = allSouls.filter((s) => s.parent_id === current.id)
    queue.push(...children)
  }
  return result
}
