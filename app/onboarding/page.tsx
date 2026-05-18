'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Mode = 'choose' | 'create' | 'join'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>('choose')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: campaign, error: ce } = await supabase
      .from('campaigns')
      .insert({ name, description })
      .select()
      .single()

    if (ce || !campaign) { setError(ce?.message ?? 'Failed to create campaign'); setLoading(false); return }

    const { error: me } = await supabase
      .from('campaign_members')
      .insert({ user_id: user.id, campaign_id: campaign.id, role: 'owner' })

    if (me) { setError(me.message); setLoading(false); return }

    router.push('/dashboard')
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: campaign, error: ce } = await supabase
      .from('campaigns')
      .select()
      .eq('join_code', joinCode.toLowerCase().trim())
      .single()

    if (ce || !campaign) { setError('Campaign not found. Check your join code.'); setLoading(false); return }

    const { error: me } = await supabase
      .from('campaign_members')
      .upsert({ user_id: user.id, campaign_id: campaign.id, role: 'member' })

    if (me) { setError(me.message); setLoading(false); return }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-white">Welcome to CampaignAnalyzer</h1>
          <p className="text-white/50 text-sm mt-2">Get started with your first campaign</p>
        </div>

        {mode === 'choose' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('create')}
              className="rounded-xl border border-white/10 bg-white/5 p-6 text-left hover:border-[#1D4ED8]/60 hover:bg-[#1D4ED8]/10 transition-all"
            >
              <div className="text-2xl mb-3">🏛</div>
              <div className="font-semibold text-white">Create Campaign</div>
              <div className="text-xs text-white/40 mt-1">Start a new campaign and invite staff</div>
            </button>
            <button
              onClick={() => setMode('join')}
              className="rounded-xl border border-white/10 bg-white/5 p-6 text-left hover:border-[#1D4ED8]/60 hover:bg-[#1D4ED8]/10 transition-all"
            >
              <div className="text-2xl mb-3">🔑</div>
              <div className="font-semibold text-white">Join Campaign</div>
              <div className="text-xs text-white/40 mt-1">Enter a join code from your campaign manager</div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-semibold text-white mb-4">Create New Campaign</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Campaign Name</label>
                <Input placeholder="Smith for Senate 2026" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Description (optional)</label>
                <Textarea placeholder="Brief description of the campaign" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setMode('choose')}>Back</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Creating…' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-semibold text-white mb-4">Join Existing Campaign</h2>
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">6-Character Join Code</label>
                <Input
                  placeholder="abc123"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  maxLength={6}
                  className="font-mono tracking-widest text-center text-lg uppercase"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setMode('choose')}>Back</Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Joining…' : 'Join Campaign'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
