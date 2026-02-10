'use client'

import { PERSONALITY_TRAITS, parseBehaviorTraits } from '@/lib/traits'

interface Props {
  traits: string[]
  temperature?: number
}

export function PersonalityTraits({ traits, temperature }: Props) {
  const parsed = parseBehaviorTraits(traits)

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-semibold text-ghost-white">Personality Traits</h4>
      <div className="flex flex-col gap-2">
        {PERSONALITY_TRAITS.map(({ key, label, color }) => {
          const value = parsed[key] ?? 0
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-20 text-xs text-nebula-gray">{label}</span>
              <div className="relative h-2 flex-1 rounded-full bg-void-surface">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${value}%`,
                    background: `linear-gradient(90deg, ${color}66, ${color})`,
                  }}
                />
              </div>
              <span className="w-8 text-right text-xs text-astral-gray">{value}</span>
            </div>
          )
        })}
      </div>
      {temperature !== undefined && (
        <div className="flex items-center gap-3 rounded-lg bg-void-surface px-3 py-2">
          <span className="text-xs text-nebula-gray">Temperature</span>
          <div className="relative h-2 flex-1 rounded-full bg-cosmic-dark">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${temperature * 100}%`,
                background: `linear-gradient(90deg, #3B82F6, #EF4444)`,
              }}
            />
          </div>
          <span className="w-8 text-right text-xs font-semibold text-ghost-white">{temperature}</span>
        </div>
      )}
    </div>
  )
}
