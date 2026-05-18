export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memberships } = await supabase
    .from('campaign_members')
    .select('campaign_id, role')
    .eq('user_id', user.id)
    .limit(1)

  const membership = memberships?.[0]
  if (!membership) redirect('/onboarding')

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', membership.campaign_id)
    .single()

  const { data: members } = await supabase
    .from('campaign_members')
    .select('user_id, role, joined_at')
    .eq('campaign_id', membership.campaign_id)

  return (
    <SettingsClient
      campaign={campaign!}
      currentUserId={user.id}
      currentRole={membership.role}
      members={members ?? []}
    />
  )
}
