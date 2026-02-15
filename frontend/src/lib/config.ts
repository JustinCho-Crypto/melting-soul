export const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'

export const isSupabaseConfigured =
  !useMockData && !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
