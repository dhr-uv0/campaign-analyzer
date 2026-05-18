'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Sparkles } from 'lucide-react'
import type { Poll, AiAnalysis, PollQuestion } from '@/lib/supabase/types'

interface Correlation {
  finding: string
  strength: 'high' | 'medium' | 'low'
  segment: string
  detail: string
  actionability: string
}

interface Props {
  poll: Poll
  questions: PollQuestion[]
  responses: { id: string; contact_id: string; question_id: string; answer: string; received_at: string }[]
  contactMap: Map<string, { id: string; phone: string; district: string | null; zip: string | null; city: string | null; name: string | null }>
  initialAnalysis: AiAnalysis | null
}

const STRENGTH_VARIANT: Record<string, 'green' | 'amber' | 'red'> = {
  high: 'green',
  medium: 'amber',
  low: 'red',
}

const STRENGTH_LABEL: Record<string, string> = {
  high: 'High strength',
  medium: 'Medium strength',
  low: 'Low strength',
}

export default function CorrelationsTab({ poll, initialAnalysis }: Props) {
  const [correlations, setCorrelations] = useState<Correlation[]>(
    (initialAnalysis?.correlations as Correlation[] | null) ?? []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/correlations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: poll.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate correlations')
      setCorrelations(data.correlations)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl text-white">AI Correlations</h2>
          <p className="text-sm text-white/40 mt-1">
            Claude analyzes cross-question and demographic patterns in your response data
          </p>
        </div>
        <Button onClick={generate} disabled={loading} variant={correlations.length > 0 ? 'outline' : 'default'}>
          {loading ? (
            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Analyzing…</>
          ) : correlations.length > 0 ? (
            <><RefreshCw className="h-4 w-4 mr-2" />Regenerate</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" />Generate Correlations</>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <RefreshCw className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Claude is analyzing your poll data…</p>
          <p className="text-white/20 text-xs mt-1">This typically takes 10–20 seconds</p>
        </div>
      )}

      {!loading && correlations.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <Sparkles className="h-10 w-10 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-sm">No correlations generated yet</p>
          <p className="text-white/20 text-xs mt-1">Click "Generate Correlations" to analyze your data</p>
        </div>
      )}

      {!loading && correlations.length > 0 && (
        <div className="grid gap-4">
          {correlations.map((c, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <p className="font-semibold text-white leading-snug">{c.finding}</p>
                <Badge variant={STRENGTH_VARIANT[c.strength] ?? 'default'} className="shrink-0">
                  {STRENGTH_LABEL[c.strength] ?? c.strength}
                </Badge>
              </div>
              <div className="text-xs text-[#F59E0B] font-medium">{c.segment}</div>
              <p className="text-sm text-white/60 leading-relaxed">{c.detail}</p>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
                <div className="text-xs text-blue-400 font-medium mb-1">What to do</div>
                <p className="text-sm text-white/70">{c.actionability}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
