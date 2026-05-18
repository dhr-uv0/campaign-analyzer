'use server'

import { createClient } from '@/lib/supabase/server'

export async function getActiveCampaignId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('campaign_members')
    .select('campaign_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  return data?.campaign_id ?? null
}
