import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN!
  const signature = req.headers.get('x-twilio-signature') ?? ''
  const url = req.url

  const body = await req.text()
  const params = Object.fromEntries(new URLSearchParams(body))

  // Validate Twilio signature
  const valid = twilio.validateRequest(authToken, signature, url, params)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const from = params['From'] ?? ''
  const answer = params['Body']?.trim() ?? ''
  const pollId = params['PollId'] ?? params['poll_id'] ?? ''
  const questionId = params['QuestionId'] ?? params['question_id'] ?? 'q1'

  if (!from || !pollId) {
    return new NextResponse(null, { status: 204 })
  }

  const supabase = createServiceClient()

  // Get campaign from poll
  const { data: poll } = await supabase.from('polls').select('campaign_id').eq('id', pollId).single()
  if (!poll) return new NextResponse(null, { status: 204 })

  // Upsert contact
  const { data: contact } = await supabase
    .from('contacts')
    .upsert({ campaign_id: poll.campaign_id, phone: from }, { onConflict: 'campaign_id,phone' })
    .select()
    .single()

  if (!contact) return new NextResponse(null, { status: 204 })

  // Insert response
  await supabase.from('responses').insert({
    poll_id: pollId,
    contact_id: contact.id,
    question_id: questionId,
    answer,
    raw_body: body,
  })

  return new NextResponse(null, { status: 204 })
}
