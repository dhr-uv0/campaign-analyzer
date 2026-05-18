import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

export function createClient() {
  // Fallback placeholder values allow the Next.js build to complete when env vars
  // are not set (e.g. during CI). Real values must be set at runtime.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  return createBrowserClient<Database>(url, key)
}
