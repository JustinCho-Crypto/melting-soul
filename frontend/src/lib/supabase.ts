import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

export const isSupabaseConfigured =
  !useMockData && !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
    _supabase = createClient(url, key)
  }
  return _supabase
}
