export const PERSONALITY_TRAITS = [
  { key: 'cynicism', label: 'Cynicism', color: '#EF4444' },
  { key: 'humor', label: 'Humor', color: '#F59E0B' },
  { key: 'formality', label: 'Formality', color: '#3B82F6' },
  { key: 'depth', label: 'Depth', color: '#A855F7' },
  { key: 'aggression', label: 'Aggression', color: '#EC4899' },
  { key: 'empathy', label: 'Empathy', color: '#10B981' },
] as const

export function parseBehaviorTraits(traits: string[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const trait of traits) {
    const [key, val] = trait.split(':')
    if (key && val) result[key] = Number(val)
  }
  return result
}
