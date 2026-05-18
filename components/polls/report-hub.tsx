'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Poll, AiAnalysis, PollQuestion } from '@/lib/supabase/types'
import StatisticsTab from './statistics-tab'
import CorrelationsTab from './correlations-tab'
import InsightsTab from './insights-tab'

interface Props {
  poll: Poll
  questions: PollQuestion[]
  responses: { id: string; contact_id: string; question_id: string; answer: string; received_at: string }[]
  contactMap: Map<string, { id: string; phone: string; district: string | null; zip: string | null; city: string | null; name: string | null }>
  aiAnalysis: AiAnalysis | null
}

const TABS = ['Statistics', 'AI Correlations', 'AI Insights'] as const
type Tab = typeof TABS[number]

export default function PollReportHub({ poll, questions, responses, contactMap, aiAnalysis }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Statistics')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-3 transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          All Polls
        </Link>
        <h1 className="font-serif text-2xl text-white">{poll.title}</h1>
        {poll.description && <p className="text-white/40 text-sm mt-1">{poll.description}</p>}
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-1 -mb-px">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-[#1D4ED8] text-white'
                  : 'border-transparent text-white/40 hover:text-white/70 hover:border-white/20'
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'Statistics' && (
        <StatisticsTab poll={poll} questions={questions} responses={responses} contactMap={contactMap} />
      )}
      {activeTab === 'AI Correlations' && (
        <CorrelationsTab poll={poll} questions={questions} responses={responses} contactMap={contactMap} initialAnalysis={aiAnalysis} />
      )}
      {activeTab === 'AI Insights' && (
        <InsightsTab poll={poll} questions={questions} responses={responses} initialAnalysis={aiAnalysis} />
      )}
    </div>
  )
}
