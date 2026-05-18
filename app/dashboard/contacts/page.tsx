export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContactsClient from './contacts-client'

export default async function ContactsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memberships } = await supabase
    .from('campaign_members')
    .select('campaign_id')
    .eq('user_id', user.id)
    .limit(1)

  const campaignId = memberships?.[0]?.campaign_id
  if (!campaignId) redirect('/onboarding')

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, phone, district, zip, city, name, tags, created_at')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  const { data: responses } = await supabase
    .from('responses')
    .select('contact_id, poll_id')

  // Count polls answered per contact
  const pollsAnswered: Record<string, Set<string>> = {}
  for (const r of (responses ?? [])) {
    const row = r as { contact_id: string; poll_id: string }
    if (!pollsAnswered[row.contact_id]) pollsAnswered[row.contact_id] = new Set()
    pollsAnswered[row.contact_id].add(row.poll_id)
  }

  return (
    <ContactsClient
      contacts={(contacts ?? []).map(c => ({
        ...c,
        pollsAnswered: pollsAnswered[c.id]?.size ?? 0,
      }))}
      campaignId={campaignId}
    />
  )
}
