import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PollReportHub from '@/components/polls/report-hub'
import type { PollQuestion } from '@/lib/supabase/types'

export default async function PollReportPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: poll } = await supabase
    .from('polls')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!poll) notFound()

  // Auth check via campaign membership
  const { data: member } = await supabase
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', poll.campaign_id)
    .eq('user_id', user.id)
    .single()

  if (!member) notFound()

  const { data: responses } = await supabase
    .from('responses')
    .select('id, contact_id, question_id, answer, received_at')
    .eq('poll_id', poll.id)
    .order('received_at', { ascending: false })

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, phone, district, zip, city, name')
    .eq('campaign_id', poll.campaign_id)

  const { data: aiAnalysis } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('poll_id', poll.id)
    .single()

  const contactMap = new Map((contacts ?? []).map(c => [c.id, c]))

  return (
    <PollReportHub
      poll={poll}
      questions={poll.questions as PollQuestion[]}
      responses={responses ?? []}
      contactMap={contactMap}
      aiAnalysis={aiAnalysis}
    />
  )
}
