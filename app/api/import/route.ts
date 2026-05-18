import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/server'

interface CsvRow {
  phone: string
  answer: string
  question_id: string
  poll_id: string
  timestamp?: string
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const text = await file.text()

  const { data: rows, errors } = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
  })

  if (errors.length > 0) {
    return NextResponse.json({ error: 'CSV parse error', details: errors[0].message }, { status: 400 })
  }

  const required = ['phone', 'answer', 'question_id', 'poll_id']
  if (!rows[0] || required.some(f => !(f in rows[0]))) {
    return NextResponse.json({ error: `CSV must have columns: ${required.join(', ')}` }, { status: 400 })
  }

  // Group rows by poll_id to validate membership
  const pollIds = [...new Set(rows.map(r => r.poll_id))]
  const { data: polls } = await supabase
    .from('polls')
    .select('id, campaign_id')
    .in('id', pollIds)

  const pollMap = new Map((polls ?? []).map(p => [p.id, p.campaign_id]))

  // Verify user is member of all campaigns
  const campaignIds = [...new Set([...pollMap.values()])]
  const { data: memberships } = await supabase
    .from('campaign_members')
    .select('campaign_id')
    .eq('user_id', user.id)
    .in('campaign_id', campaignIds)

  const memberSet = new Set((memberships ?? []).map(m => m.campaign_id))
  if (campaignIds.some(id => !memberSet.has(id))) {
    return NextResponse.json({ error: 'Not a member of all campaigns in this CSV' }, { status: 403 })
  }

  let imported = 0
  let skipped = 0

  for (const row of rows) {
    const campaignId = pollMap.get(row.poll_id)
    if (!campaignId) { skipped++; continue }

    const { data: contact } = await supabase
      .from('contacts')
      .upsert({ campaign_id: campaignId, phone: row.phone }, { onConflict: 'campaign_id,phone' })
      .select()
      .single()

    if (!contact) { skipped++; continue }

    await supabase.from('responses').insert({
      poll_id: row.poll_id,
      contact_id: contact.id,
      question_id: row.question_id,
      answer: row.answer,
      received_at: row.timestamp ?? new Date().toISOString(),
    })
    imported++
  }

  return NextResponse.json({ imported, skipped })
}
