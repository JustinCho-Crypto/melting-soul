export interface Modifier {
  id: string
  label: string
  category: 'style' | 'tone' | 'domain' | 'culture'
  trait_effects?: Record<string, number>
  temperature_delta?: number
  prompt_hint: string
}

export const MODIFIERS: Modifier[] = [
  // Style
  { id: 'formal', label: '+formal', category: 'style', trait_effects: { formality: 30 }, prompt_hint: 'Speak formally and professionally' },
  { id: 'casual', label: '+casual', category: 'style', trait_effects: { formality: -30 }, prompt_hint: 'Speak casually and relaxed' },
  { id: 'concise', label: '+concise', category: 'style', prompt_hint: 'Keep responses brief and to the point' },
  { id: 'verbose', label: '+verbose', category: 'style', prompt_hint: 'Give detailed, thorough responses' },
  { id: 'socratic', label: '+socratic', category: 'style', prompt_hint: 'Answer with questions that guide the user to discover answers themselves' },

  // Tone
  { id: 'aggressive', label: '+aggressive', category: 'tone', trait_effects: { aggression: 30 }, prompt_hint: 'Be assertive and direct' },
  { id: 'gentle', label: '+gentle', category: 'tone', trait_effects: { aggression: -30, empathy: 20 }, prompt_hint: 'Be soft-spoken and kind' },
  { id: 'humorous', label: '+humorous', category: 'tone', trait_effects: { humor: 50 }, temperature_delta: 0.1, prompt_hint: 'Use humor, wit, and jokes' },
  { id: 'sarcastic', label: '+sarcastic', category: 'tone', trait_effects: { humor: 20, cynicism: 20 }, prompt_hint: 'Use sarcasm and dry wit' },
  { id: 'stoic', label: '+stoic', category: 'tone', trait_effects: { empathy: -20, formality: 20 }, prompt_hint: 'Be calm, measured, and emotionally detached' },

  // Domain
  { id: 'crypto', label: '+crypto', category: 'domain', prompt_hint: 'Native to crypto culture and technology' },
  { id: 'web3', label: '+web3', category: 'domain', prompt_hint: 'Native to web3 culture: NFTs, DAOs, decentralization' },
  { id: 'startup', label: '+startup', category: 'domain', prompt_hint: 'Think in startup terms: growth, PMF, fundraising' },
  { id: 'finance', label: '+finance', category: 'domain', prompt_hint: 'Focus on financial analysis and markets' },
  { id: 'ai-ml', label: '+ai-ml', category: 'domain', prompt_hint: 'Focus on AI and machine learning topics' },

  // Culture
  { id: 'korean', label: '+korean', category: 'culture', prompt_hint: 'Incorporate Korean cultural references and expressions' },
  { id: 'gen-z', label: '+gen-z', category: 'culture', trait_effects: { formality: -20 }, prompt_hint: 'Use Gen-Z slang and communication style' },
  { id: 'degen', label: '+degen', category: 'culture', trait_effects: { formality: -40, humor: 20 }, prompt_hint: "Speak like a crypto degen: 'ser', 'ngmi', 'wagmi'" },
  { id: 'academic', label: '+academic', category: 'culture', trait_effects: { formality: 30, depth: 20 }, prompt_hint: 'Use academic language and cite theories' },
  { id: 'meme', label: '+meme', category: 'culture', trait_effects: { humor: 30 }, temperature_delta: 0.1, prompt_hint: 'Communicate through memes and internet culture references' },
]

export const MODIFIER_CATEGORIES = ['style', 'tone', 'domain', 'culture'] as const

export function getModifiersByCategory(category: string): Modifier[] {
  return MODIFIERS.filter((m) => m.category === category)
}

export interface TraitConfig {
  key: string
  label: string
  min: number
  max: number
  step: number
}

export const TRAITS: TraitConfig[] = [
  { key: 'cynicism', label: 'Cynicism', min: 0, max: 100, step: 5 },
  { key: 'humor', label: 'Humor', min: 0, max: 100, step: 5 },
  { key: 'formality', label: 'Formality', min: 0, max: 100, step: 5 },
  { key: 'depth', label: 'Depth', min: 0, max: 100, step: 5 },
  { key: 'aggression', label: 'Aggression', min: 0, max: 100, step: 5 },
  { key: 'empathy', label: 'Empathy', min: 0, max: 100, step: 5 },
]
