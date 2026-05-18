'use client'

import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate, maskPhone, formatPercent } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { Poll, PollQuestion } from '@/lib/supabase/types'
import ContactSlideOver from './contact-slide-over'

interface Response {
  id: string
  contact_id: string
  question_id: string
  answer: string
  received_at: string
}

interface Contact {
  id: string
  phone: string
  district: string | null
  zip: string | null
  city: string | null
  name: string | null
}

interface Props {
  poll: Poll
  questions: PollQuestion[]
  responses: Response[]
  contactMap: Map<string, Contact>
}

interface Filter { questionId: string; answer: string }

export default function StatisticsTab({ poll, questions, responses, contactMap }: Props) {
  const [filter, setFilter] = useState<Filter | null>(null)
  const [search, setSearch] = useState('')
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [sortCol, setSortCol] = useState<string>('received_at')
  const [sortAsc, setSortAsc] = useState(false)

  // Unique respondents
  const respondentIds = useMemo(() => [...new Set(responses.map(r => r.contact_id))], [responses])

  // Summary stats
  const firstResponse = responses.length > 0
    ? responses.reduce((a, b) => a.received_at < b.received_at ? a : b).received_at
    : null
  const lastResponse = responses.length > 0
    ? responses.reduce((a, b) => a.received_at > b.received_at ? a : b).received_at
    : null
  const responseRate = poll.sent_count && poll.sent_count > 0
    ? formatPercent(respondentIds.length, poll.sent_count)
    : null

  // Chart data per question
  const chartData = useMemo(() => {
    return questions.map(q => {
      const qResponses = responses.filter(r => r.question_id === q.id)
      const total = qResponses.length
      return {
        question: q,
        bars: q.options.map(opt => ({
          option: opt,
          count: qResponses.filter(r => r.answer === opt).length,
          total,
        })),
      }
    })
  }, [questions, responses])

  // Filtered respondents for table
  const filteredRespondents = useMemo(() => {
    let ids = respondentIds
    if (filter) {
      const matchingContactIds = new Set(
        responses.filter(r => r.question_id === filter.questionId && r.answer === filter.answer).map(r => r.contact_id)
      )
      ids = ids.filter(id => matchingContactIds.has(id))
    }
    if (search) {
      const s = search.toLowerCase()
      ids = ids.filter(id => {
        const c = contactMap.get(id)
        if (!c) return false
        return (
          c.phone.includes(s) ||
          c.district?.toLowerCase().includes(s) ||
          c.zip?.includes(s) ||
          c.name?.toLowerCase().includes(s)
        )
      })
    }
    return ids
  }, [respondentIds, filter, search, responses, contactMap])

  function downloadCSV() {
    const headers = ['Phone', ...questions.map(q => q.text), 'District', 'ZIP', 'Timestamp']
    const rows = filteredRespondents.map(id => {
      const c = contactMap.get(id)
      const answers = questions.map(q => {
        const r = responses.find(r => r.contact_id === id && r.question_id === q.id)
        return r?.answer ?? ''
      })
      const latestResponse = responses.filter(r => r.contact_id === id).sort((a, b) => b.received_at.localeCompare(a.received_at))[0]
      return [c?.phone ?? '', ...answers, c?.district ?? '', c?.zip ?? '', latestResponse?.received_at ?? '']
    })

    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${poll.title.replace(/\s+/g, '-')}-responses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Respondents', value: respondentIds.length.toLocaleString(), mono: true },
          { label: 'Response Rate', value: responseRate ?? '—', mono: true, accent: true },
          { label: 'First Response', value: formatDate(firstResponse) },
          { label: 'Last Response', value: formatDate(lastResponse) },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className={`text-lg font-medium ${s.mono ? 'font-mono' : ''} ${s.accent ? 'text-[#F59E0B]' : 'text-white'}`}>
              {s.value}
            </div>
            <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {chartData.map(({ question, bars }) => (
        <div key={question.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="font-serif text-base text-white mb-4">{question.text}</h3>
          <ResponsiveContainer width="100%" height={Math.max(bars.length * 44, 120)}>
            <BarChart data={bars} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="option" width={180} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const d = payload[0].payload as { option: string; count: number; total: number }
                  return (
                    <div className="bg-[#0f1f38] border border-white/20 rounded-lg px-3 py-2 text-sm">
                      <div className="text-white font-medium">{d.option}</div>
                      <div className="text-white/60">{d.count} responses ({formatPercent(d.count, d.total)})</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {bars.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={filter?.questionId === question.id && filter.answer === entry.option ? '#F59E0B' : '#1D4ED8'}
                    cursor="pointer"
                    onClick={() => setFilter(
                      filter?.questionId === question.id && filter.answer === entry.option
                        ? null
                        : { questionId: question.id, answer: entry.option }
                    )}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Percentage labels */}
          <div className="mt-2 space-y-0.5">
            {bars.map(b => (
              <div key={b.option} className="flex items-center justify-between text-xs">
                <span className="text-white/40 truncate max-w-[200px]">{b.option}</span>
                <span className="font-mono text-white/60">{b.count} ({formatPercent(b.count, b.total)})</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-white text-sm">Respondents</h3>
            <span className="font-mono text-xs text-white/40">{filteredRespondents.length.toLocaleString()}</span>
            {filter && (
              <button
                onClick={() => setFilter(null)}
                className="flex items-center gap-1 text-xs text-[#F59E0B] hover:text-amber-300 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear filter
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-7 text-xs w-40"
            />
            <Button variant="outline" size="sm" onClick={downloadCSV}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              CSV
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-2.5 text-xs text-white/40 font-medium">Phone</th>
                {questions.map(q => (
                  <th key={q.id} className="text-left px-4 py-2.5 text-xs text-white/40 font-medium max-w-[160px]">
                    <span className="truncate block">{q.text}</span>
                  </th>
                ))}
                <th className="text-left px-4 py-2.5 text-xs text-white/40 font-medium">District</th>
                <th className="text-left px-4 py-2.5 text-xs text-white/40 font-medium">ZIP</th>
                <th
                  className="text-left px-4 py-2.5 text-xs text-white/40 font-medium cursor-pointer"
                  onClick={() => { setSortCol('received_at'); setSortAsc(!sortAsc) }}
                >
                  <span className="flex items-center gap-1">
                    Time
                    {sortCol === 'received_at' ? (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRespondents.slice(0, 200).map(id => {
                const c = contactMap.get(id)
                const latestResponse = responses.filter(r => r.contact_id === id).sort((a, b) => b.received_at.localeCompare(a.received_at))[0]
                return (
                  <tr
                    key={id}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setSelectedContactId(id)}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-white/70">{maskPhone(c?.phone ?? '0000000000')}</td>
                    {questions.map(q => {
                      const r = responses.find(r => r.contact_id === id && r.question_id === q.id)
                      return (
                        <td key={q.id} className="px-4 py-2.5 text-xs text-white/60 max-w-[160px]">
                          <span className="truncate block">{r?.answer ?? '—'}</span>
                        </td>
                      )
                    })}
                    <td className="px-4 py-2.5 text-xs text-white/40">{c?.district ?? '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-white/40">{c?.zip ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-white/40">{formatDate(latestResponse?.received_at ?? null)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredRespondents.length > 200 && (
            <div className="px-4 py-2 text-xs text-white/30 text-center">
              Showing 200 of {filteredRespondents.length} rows — use CSV export for full dataset
            </div>
          )}
        </div>
      </div>

      {selectedContactId && (
        <ContactSlideOver
          contactId={selectedContactId}
          campaignId={poll.campaign_id}
          onClose={() => setSelectedContactId(null)}
        />
      )}
    </div>
  )
}
