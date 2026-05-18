'use client'

import { useState } from 'react'
import { maskPhone } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Users } from 'lucide-react'
import ContactSlideOver from '@/components/polls/contact-slide-over'

interface Contact {
  id: string
  phone: string
  district: string | null
  zip: string | null
  city: string | null
  name: string | null
  tags: string[] | null
  pollsAnswered: number
}

interface Props {
  contacts: Contact[]
  campaignId: string
}

export default function ContactsClient({ contacts, campaignId }: Props) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = contacts.filter(c => {
    const s = search.toLowerCase()
    return !s || c.phone.includes(s) || c.district?.toLowerCase().includes(s) || c.zip?.includes(s) || c.name?.toLowerCase().includes(s)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-white">Contacts</h1>
          <p className="text-sm text-white/40 mt-1">{contacts.length.toLocaleString()} respondents in this campaign</p>
        </div>
        <Input
          placeholder="Search by district, ZIP, phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
          <Users className="h-10 w-10 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 text-sm">No contacts yet. Contacts are created when poll responses are received.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Phone', 'District', 'ZIP', 'City', 'Polls Answered', 'Tags'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-white/40 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr
                  key={c.id}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setSelectedId(c.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-white/70">{maskPhone(c.phone)}</td>
                  <td className="px-4 py-3 text-xs text-white/60">{c.district ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{c.zip ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-white/60">{c.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-white/70">{c.pollsAnswered}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags ?? []).map(t => (
                        <span key={t} className="rounded-full bg-blue-500/20 text-blue-400 px-2 py-0.5 text-xs">{t}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-white/30">No contacts match your search</div>
          )}
        </div>
      )}

      {selectedId && (
        <ContactSlideOver contactId={selectedId} campaignId={campaignId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
