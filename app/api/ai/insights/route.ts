import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { PollQuestion } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { poll_id } = await req.json()
  if (!poll_id) return NextResponse.json({ error: 'poll_id required' }, { status: 400 })

  const { data: poll } = await supabase.from('polls').select('*').eq('id', poll_id).single()
  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 })

  const { data: member } = await supabase
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', poll.campaign_id)
    .eq('user_id', user.id)
    .single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: existingAnalysis } = await supabase
    .from('ai_analysis')
    .select('correlations')
    .eq('poll_id', poll_id)
    .single()

  const { data: responses } = await supabase
    .from('responses')
    .select('contact_id, question_id, answer')
    .eq('poll_id', poll_id)

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, district, zip')
    .eq('campaign_id', poll.campaign_id)

  const contactMap = new Map((contacts ?? []).map(c => [c.id, c]))
  const questions = poll.questions as PollQuestion[]
  const totalRespondents = [...new Set((responses ?? []).map(r => r.contact_id))].length

  const optionSummaries = questions.map(q => {
    const qr = (responses ?? []).filter(r => r.question_id === q.id)
    const counts: Record<string, number> = {}
    for (const r of qr) counts[r.answer] = (counts[r.answer] ?? 0) + 1
    return { question: q.text, counts, total: qr.length }
  })

  const districtBreakdown: Record<string, Record<string, Record<string, number>>> = {}
  for (const r of (responses ?? [])) {
    const c = contactMap.get(r.contact_id)
    if (!c?.district) continue
    districtBreakdown[c.district] = districtBreakdown[c.district] ?? {}
    districtBreakdown[c.district][r.question_id] = districtBreakdown[c.district][r.question_id] ?? {}
    districtBreakdown[c.district][r.question_id][r.answer] =
      (districtBreakdown[c.district][r.question_id][r.answer] ?? 0) + 1
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a senior political strategist. Write a strategic intelligence memo based on this poll data.

Poll: "${poll.title}"
Total respondents: ${totalRespondents}
${poll.sent_count ? `Sent to: ${poll.sent_count} contacts (${Math.round((totalRespondents / poll.sent_count) * 100)}% response rate)` : ''}

Response summaries by question:
${JSON.stringify(optionSummaries, null, 2)}

District breakdown:
${JSON.stringify(districtBreakdown, null, 2)}

${existingAnalysis?.correlations ? `AI-detected correlations:\n${JSON.stringify(existingAnalysis.correlations, null, 2)}` : ''}

Write a structured strategic memo with these exact sections (use these exact headings):
## Executive Summary
## Key Voter Segments
## Messaging Recommendations
## Outreach Priorities
## Risks & Counterintuitive Findings

Each section should be thorough and specific. Use data to support every claim. Write for a campaign manager who will act on this today.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })

  const insights = message.content[0].type === 'text' ? message.content[0].text : ''

  // Cache in ai_analysis
  await supabase
    .from('ai_analysis')
    .upsert({ poll_id, insights }, { onConflict: 'poll_id' })

  return NextResponse.json({ insights })
}
