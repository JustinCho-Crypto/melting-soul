import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

export const isSupabaseConfigured =
  !useMockData && !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export interface Soul {
  id: string
  token_id: number
  name: string
  description: string
  image_url: string
  conversation_style: string
  knowledge_domain: string[]
  system_prompt?: string
  behavior_traits?: string[]
  temperature?: number
  additional_prompt?: string
  added_traits?: string[]
  fork_note?: string
  parent_id?: string
  generation: number
  creator_address: string
  created_at: string
}

export interface Listing {
  id: string
  listing_id: number
  soul_id: string
  token_id: number
  seller_address: string
  price: string
  amount: number
  remaining_amount: number
  is_active: boolean
}
