import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { PlusCircle, BarChart2 } from 'lucide-react'
import CampaignIdProvider from '@/components/dashboard/campaign-id-provider'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memberships } = await supabase
    .from('campaign_members')
    .select('campaign_id, role')
    .eq('user_id', user.id)

  const campaignIds = (memberships ?? []).map(m => m.campaign_id)
  if (campaignIds.length === 0) redirect('/onboarding')

  // Use the first campaign by default (client-side switcher overrides)
  const campaignId = campaignIds[0]

  const { data: polls } = await supabase
    .from('polls')
    .select('id, title, description, sent_count, sent_at, created_at')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  const pollIds = (polls ?? []).map(p => p.id)

  // Response counts per poll
  const { data: responseCounts } = pollIds.length > 0
    ? await supabase
        .from('responses')
        .select('poll_id')
        .in('poll_id', pollIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const r of (responseCounts ?? [])) {
    const pollId = (r as { poll_id: string }).poll_id
    const questionIds = new Set<string>()
    if (!countMap[pollId]) countMap[pollId] = 0
    countMap[pollId]++
  }

  // Get unique respondents (contact_id) per poll
  const { data: uniqueRespondents } = pollIds.length > 0
    ? await supabase
        .from('responses')
        .select('poll_id, contact_id')
        .in('poll_id', pollIds)
    : { data: [] }

  const uniqueMap: Record<string, Set<string>> = {}
  for (const r of (uniqueRespondents ?? [])) {
    const row = r as { poll_id: string; contact_id: string }
    if (!uniqueMap[row.poll_id]) uniqueMap[row.poll_id] = new Set()
    uniqueMap[row.poll_id].add(row.contact_id)
  }

  return (
    <CampaignIdProvider campaignId={campaignId}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-white">Polls</h1>
          <Link href="/dashboard/polls/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Poll
            </Button>
          </Link>
        </div>

        {(polls ?? []).length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
            <BarChart2 className="h-10 w-10 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-sm">No polls yet. Create your first poll to get started.</p>
            <Link href="/dashboard/polls/new" className="mt-4 inline-block">
              <Button size="sm">Create Poll</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {(polls ?? []).map(poll => {
              const responseCount = uniqueMap[poll.id]?.size ?? 0
              const responseRate = poll.sent_count && poll.sent_count > 0
                ? `${Math.round((responseCount / poll.sent_count) * 100)}%`
                : null

              return (
                <Link
                  key={poll.id}
                  href={`/dashboard/polls/${poll.id}`}
                  className="block rounded-xl border border-white/10 bg-white/5 p-5 hover:border-[#1D4ED8]/40 hover:bg-[#1D4ED8]/5 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-white truncate">{poll.title}</h2>
                      {poll.description && (
                        <p className="text-sm text-white/40 mt-0.5 truncate">{poll.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-right shrink-0">
                      <div>
                        <div className="font-mono text-lg text-white">{responseCount}</div>
                        <div className="text-xs text-white/40">respondents</div>
                      </div>
                      {responseRate && (
                        <div>
                          <div className="font-mono text-lg text-[#F59E0B]">{responseRate}</div>
                          <div className="text-xs text-white/40">response rate</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-white/40">{formatDate(poll.created_at)}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </CampaignIdProvider>
  )
}
