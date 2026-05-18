'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Copy, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Campaign } from '@/lib/supabase/types'

interface Member { user_id: string; role: string; joined_at: string }

interface Props {
  campaign: Campaign
  currentUserId: string
  currentRole: string
  members: Member[]
}

export default function SettingsClient({ campaign, currentUserId, currentRole, members }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState(campaign.name)
  const [description, setDescription] = useState(campaign.description ?? '')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error: err } = await supabase
      .from('campaigns')
      .update({ name, description: description || null })
      .eq('id', campaign.id)
    setSaving(false)
    if (err) setError(err.message)
    else router.refresh()
  }

  function copyJoinCode() {
    navigator.clipboard.writeText(campaign.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function removeMember(userId: string) {
    await supabase
      .from('campaign_members')
      .delete()
      .eq('campaign_id', campaign.id)
      .eq('user_id', userId)
    router.refresh()
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-serif text-2xl text-white">Campaign Settings</h1>

      {/* Campaign info */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h2 className="font-semibold text-white text-sm">Campaign Details</h2>
        <form onSubmit={saveSettings} className="space-y-4">
          <div>
            <label className="text-xs text-white/60 mb-1 block">Campaign Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} disabled={currentRole !== 'owner'} />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} disabled={currentRole !== 'owner'} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {currentRole === 'owner' && (
            <Button type="submit" disabled={saving} size="sm">
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          )}
        </form>
      </div>

      {/* Join code */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-semibold text-white text-sm mb-3">Join Code</h2>
        <p className="text-xs text-white/40 mb-3">Share this code with staff to give them access to this campaign</p>
        <div className="flex items-center gap-3">
          <div className="font-mono text-2xl tracking-[0.4em] text-white bg-white/5 border border-white/10 rounded-lg px-4 py-2">
            {campaign.join_code.toUpperCase()}
          </div>
          <Button variant="outline" size="sm" onClick={copyJoinCode}>
            {copied ? <><Check className="h-3.5 w-3.5 mr-1.5" />Copied!</> : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copy</>}
          </Button>
        </div>
      </div>

      {/* Members */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-semibold text-white text-sm mb-4">Members ({members.length})</h2>
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-mono">
                  {m.user_id.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-mono text-white/60">{m.user_id.slice(0, 8)}…</div>
                  <div className="text-xs text-white/30">{formatDate(m.joined_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={m.role === 'owner' ? 'blue' : 'default'}>{m.role}</Badge>
                {currentRole === 'owner' && m.user_id !== currentUserId && (
                  <Button variant="ghost" size="sm" onClick={() => removeMember(m.user_id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seed data */}
      {process.env.NEXT_PUBLIC_ENABLE_SEED === 'true' && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="font-semibold text-[#F59E0B] text-sm mb-2">Development: Seed Data</h2>
          <p className="text-xs text-white/40 mb-3">Populate this campaign with mock polls and responses for testing</p>
          <Button
            variant="amber"
            size="sm"
            onClick={async () => {
              await fetch('/api/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaign_id: campaign.id }),
              })
              router.push('/dashboard')
            }}
          >
            Seed Mock Data
          </Button>
        </div>
      )}
    </div>
  )
}
