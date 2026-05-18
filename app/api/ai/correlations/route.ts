import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { Poll, PollQuestion } from '@/lib/supabase/types'

interface ResponseRow { contact_id: string; question_id: string; answer: string }
interface ContactRow { id: string; district: string | null; zip: string | null; city: string | null }

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { poll_id } = await req.json()
  if (!poll_id) return NextResponse.json({ error: 'poll_id required' }, { status: 400 })

  const { data: pollData } = await supabase.from('polls').select('*').eq('id', poll_id).single()
  if (!pollData) return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
  const poll = pollData as unknown as Poll

  const { data: memberData } = await supabase
    .from('campaign_members')
    .select('role')
    .eq('campaign_id', poll.campaign_id)
    .eq('user_id', user.id)
    .single()
  if (!memberData) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: responsesData } = await supabase
    .from('responses')
    .select('contact_id, question_id, answer')
    .eq('poll_id', poll_id)
  const responses = (responsesData ?? []) as unknown as ResponseRow[]

  const { data: contactsData } = await supabase
    .from('contacts')
    .select('id, district, zip, city')
    .eq('campaign_id', poll.campaign_id)
  const contacts = (contactsData ?? []) as unknown as ContactRow[]

  const contactMap = new Map(contacts.map(c => [c.id, c]))
  const questions = poll.questions as unknown as PollQuestion[]

  const questionSummaries = questions.map(q => {
    const qResponses = responses.filter(r => r.question_id === q.id)
    const byDistrict: Record<string, Record<string, number>> = {}
    const byZip: Record<string, Record<string, number>> = {}
    const optionCounts: Record<string, number> = {}

    for (const r of qResponses) {
      optionCounts[r.answer] = (optionCounts[r.answer] ?? 0) + 1
      const c = contactMap.get(r.contact_id)
      if (c?.district) {
        byDistrict[c.district] ??= {}
        byDistrict[c.district][r.answer] = (byDistrict[c.district][r.answer] ?? 0) + 1
      }
      if (c?.zip) {
        byZip[c.zip] ??= {}
        byZip[c.zip][r.answer] = (byZip[c.zip][r.answer] ?? 0) + 1
      }
    }
    return { questionId: q.id, text: q.text, options: q.options, optionCounts, byDistrict, byZip, total: qResponses.length }
  })

  const crossQuestionData: Record<string, number> = {}
  if (questions.length >= 2) {
    const q1Id = questions[0].id
    const q2Id = questions[1].id
    const contactIds = Array.from(new Set(responses.map(r => r.contact_id)))
    for (const contactId of contactIds) {
      const a1 = responses.find(r => r.contact_id === contactId && r.question_id === q1Id)?.answer
      const a2 = responses.find(r => r.contact_id === contactId && r.question_id === q2Id)?.answer
      if (a1 && a2) {
        const key = `${a1}|||${a2}`
        crossQuestionData[key] = (crossQuestionData[key] ?? 0) + 1
      }
    }
  }

  const totalRespondents = Array.from(new Set(responses.map(r => r.contact_id))).length

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a political data analyst. Analyze this poll data and identify statistically notable correlations.

Poll: "${poll.title}"
Total respondents: ${totalRespondents}

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

  await supabase
    .from('ai_analysis')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ poll_id, correlations } as any, { onConflict: 'poll_id' })

  return NextResponse.json({ correlations })
}
