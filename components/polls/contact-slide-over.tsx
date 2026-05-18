'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { maskPhone, formatDate } from '@/lib/utils'
import { X } from 'lucide-react'

interface Props {
  contactId: string
  campaignId: string
  onClose: () => void
}

interface PollResponse {
  poll_id: string
  question_id: string
  answer: string
  received_at: string
  poll_title: string
}

export default function ContactSlideOver({ contactId, campaignId, onClose }: Props) {
  const supabase = createClient()
  const [contact, setContact] = useState<{ phone: string; district: string | null; zip: string | null; city: string | null } | null>(null)
  const [history, setHistory] = useState<PollResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: r }] = await Promise.all([
        supabase.from('contacts').select('phone, district, zip, city').eq('id', contactId).single(),
        supabase.from('responses').select('poll_id, question_id, answer, received_at, polls(title)').eq('contact_id', contactId).order('received_at', { ascending: false }),
      ])
      setContact(c)
      setHistory(
        (r ?? []).map(row => ({
          poll_id: (row as any).poll_id,
          question_id: (row as any).question_id,
          answer: (row as any).answer,
          received_at: (row as any).received_at,
          poll_title: (row as any).polls?.title ?? 'Unknown Poll',
        }))
      )
      setLoading(false)
    }
    load()
  }, [contactId])

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-md bg-[#0f1f38] border-l border-white/10 overflow-y-auto">
        <div className="sticky top-0 bg-[#0f1f38] border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Contact History</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        {loading ? (
          <div className="p-6 text-center text-white/40 text-sm">Loading…</div>
        ) : (
          <div className="p-5 space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="text-xs text-white/40">Phone</div>
              <div className="font-mono text-white">{maskPhone(contact?.phone ?? '')}</div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <div className="text-xs text-white/40">District</div>
                  <div className="text-sm text-white">{contact?.district ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40">ZIP</div>
                  <div className="font-mono text-sm text-white">{contact?.zip ?? '—'}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3">Poll History</h3>
              <div className="space-y-3">
                {history.map((h, i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/40 mb-1">{h.poll_title}</div>
                    <div className="text-sm text-white">{h.answer}</div>
                    <div className="text-xs text-white/30 mt-1">{formatDate(h.received_at)}</div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-sm text-white/30">No history found</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
