import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ENABLE_SEED = process.env.ENABLE_SEED === 'true'

const DISTRICTS = ['District 1', 'District 3', 'District 7', 'District 9', 'District 12']
const ZIPS = ['90210', '90211', '90212', '90230', '90232', '90245', '90301', '90302']
const CITIES = ['Beverly Hills', 'Culver City', 'El Segundo', 'Inglewood']

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomPhone(): string {
  return `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
}

export async function POST(req: NextRequest) {
  if (!ENABLE_SEED) {
    return NextResponse.json({ error: 'Seed disabled in production' }, { status: 403 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const campaignId: string = body.campaign_id

  if (!campaignId) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })

  const pollsData = [
    {
      title: 'Healthcare Priority Poll',
      description: 'Voter attitudes toward healthcare reform',
      questions: [
        {
          id: 'q1',
          text: 'How important is healthcare to your vote?',
          options: ['Extremely important', 'Very important', 'Somewhat important', 'Not important'],
        },
        {
          id: 'q2',
          text: 'Do you support a public healthcare option?',
          options: ['Strongly support', 'Support', 'Oppose', 'Strongly oppose'],
        },
      ],
      sent_count: 200,
    },
    {
      title: 'Infrastructure & Economy Poll',
      description: 'Priorities for infrastructure spending',
      questions: [
        {
          id: 'q1',
          text: 'Should we prioritize infrastructure spending?',
          options: ['Yes, immediately', 'Yes, but carefully', 'No, focus on debt first', 'Unsure'],
        },
        {
          id: 'q2',
          text: 'What economic issue concerns you most?',
          options: ['Inflation', 'Jobs', 'Housing', 'Healthcare costs'],
        },
      ],
      sent_count: 200,
    },
    {
      title: 'Climate & Energy Poll',
      description: 'Voter views on energy policy',
      questions: [
        {
          id: 'q1',
          text: 'Which energy policy do you prefer?',
          options: ['Renewables transition', 'Natural gas bridge', 'Nuclear expansion', 'Status quo'],
        },
      ],
      sent_count: 200,
    },
  ]

  const createdPolls = []
  for (const p of pollsData) {
    const { data } = await supabase
      .from('polls')
      .insert({ campaign_id: campaignId, ...p })
      .select()
      .single()
    if (data) createdPolls.push({ ...data, questions: p.questions })
  }

  // Seed 200 contacts and responses per poll
  let totalResponses = 0
  for (const poll of createdPolls) {
    for (let i = 0; i < 200; i++) {
      const phone = randomPhone()
      const { data: contact } = await supabase
        .from('contacts')
        .upsert({
          campaign_id: campaignId,
          phone,
          district: randomFrom(DISTRICTS),
          zip: randomFrom(ZIPS),
          city: randomFrom(CITIES),
        }, { onConflict: 'campaign_id,phone' })
        .select()
        .single()

      if (!contact) continue

      for (const question of poll.questions) {
        const answer = randomFrom(question.options)
        const hoursAgo = Math.floor(Math.random() * 72)
        const received_at = new Date(Date.now() - hoursAgo * 3600000).toISOString()

        await supabase.from('responses').insert({
          poll_id: poll.id,
          contact_id: contact.id,
          question_id: question.id,
          answer,
          received_at,
        })
        totalResponses++
      }
    }
  }

  return NextResponse.json({ polls: createdPolls.length, responses: totalResponses })
}
