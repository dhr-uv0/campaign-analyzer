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

  const { data: responses } = await supabase
    .from('responses')
    .select('contact_id, question_id, answer')
    .eq('poll_id', poll_id)

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, district, zip, city')
    .eq('campaign_id', poll.campaign_id)

  const contactMap = new Map((contacts ?? []).map(c => [c.id, c]))
  const questions = poll.questions as PollQuestion[]

  // Aggregate anonymized summary
  const questionSummaries = questions.map(q => {
    const qResponses = (responses ?? []).filter(r => r.question_id === q.id)
    const byDistrict: Record<string, Record<string, number>> = {}
    const byZip: Record<string, Record<string, number>> = {}
    const optionCounts: Record<string, number> = {}

    for (const r of qResponses) {
      optionCounts[r.answer] = (optionCounts[r.answer] ?? 0) + 1
      const c = contactMap.get(r.contact_id)
      if (c?.district) {
        byDistrict[c.district] = byDistrict[c.district] ?? {}
        byDistrict[c.district][r.answer] = (byDistrict[c.district][r.answer] ?? 0) + 1
      }
      if (c?.zip) {
        byZip[c.zip] = byZip[c.zip] ?? {}
        byZip[c.zip][r.answer] = (byZip[c.zip][r.answer] ?? 0) + 1
      }
    }

    return { questionId: q.id, text: q.text, options: q.options, optionCounts, byDistrict, byZip, total: qResponses.length }
  })

  // Cross-question correlations (anonymized)
  const crossQuestionData: Record<string, Record<string, number>> = {}
  if (questions.length >= 2) {
    const q1Id = questions[0].id
    const q2Id = questions[1].id
    for (const contactId of [...new Set((responses ?? []).map(r => r.contact_id))]) {
      const a1 = (responses ?? []).find(r => r.contact_id === contactId && r.question_id === q1Id)?.answer
      const a2 = (responses ?? []).find(r => r.contact_id === contactId && r.question_id === q2Id)?.answer
      if (a1 && a2) {
        const key = `${a1}|||${a2}`
        crossQuestionData[key] = (crossQuestionData[key] ?? 0) + 1
      }
    }
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a political data analyst. Analyze this poll data and identify statistically notable correlations.

Poll: "${poll.title}"
Total respondents: ${[...new Set((responses ?? []).map(r => r.contact_id))].length}

Question summaries:
${JSON.stringify(questionSummaries, null, 2)}

Cross-question answer combinations:
${JSON.stringify(crossQuestionData, null, 2)}

Return a JSON array of correlation objects. Each must have:
- finding: string (one sentence describing the correlation)
- strength: "high" | "medium" | "low"
- segment: string (which voter group or geographic segment)
- detail: string (2-3 sentences explaining the statistical basis)
- actionability: string (what the campaign should do with this finding)

Return ONLY valid JSON array, no markdown, no explanation.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
  let correlations
  try {
    correlations = JSON.parse(text)
  } catch {
    correlations = []
  }

  // Cache in ai_analysis
  await supabase
    .from('ai_analysis')
    .upsert({ poll_id, correlations }, { onConflict: 'poll_id' })

  return NextResponse.json({ correlations })
}
