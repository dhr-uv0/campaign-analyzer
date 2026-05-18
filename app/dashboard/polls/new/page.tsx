'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircle, Trash2, X } from 'lucide-react'
import type { PollQuestion } from '@/lib/supabase/types'

export default function NewPollPage() {
  const router = useRouter()
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sentCount, setSentCount] = useState('')
  const [questions, setQuestions] = useState<PollQuestion[]>([
    { id: crypto.randomUUID(), text: '', options: ['', ''] },
  ])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function addQuestion() {
    setQuestions(q => [...q, { id: crypto.randomUUID(), text: '', options: ['', ''] }])
  }

  function removeQuestion(id: string) {
    setQuestions(q => q.filter(qq => qq.id !== id))
  }

  function updateQuestion(id: string, text: string) {
    setQuestions(q => q.map(qq => (qq.id === id ? { ...qq, text } : qq)))
  }

  function addOption(qId: string) {
    setQuestions(q => q.map(qq => (qq.id === qId ? { ...qq, options: [...qq.options, ''] } : qq)))
  }

  function removeOption(qId: string, idx: number) {
    setQuestions(q =>
      q.map(qq => (qq.id === qId ? { ...qq, options: qq.options.filter((_, i) => i !== idx) } : qq))
    )
  }

  function updateOption(qId: string, idx: number, value: string) {
    setQuestions(q =>
      q.map(qq =>
        qq.id === qId ? { ...qq, options: qq.options.map((o, i) => (i === idx ? value : o)) } : qq
      )
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const campaignId = typeof window !== 'undefined'
      ? localStorage.getItem('activeCampaignId')
      : null

    if (!campaignId) { setError('No active campaign found'); setSaving(false); return }

    const cleanedQuestions = questions.map(q => ({
      ...q,
      options: q.options.filter(o => o.trim()),
    })).filter(q => q.text.trim() && q.options.length >= 2)

    if (cleanedQuestions.length === 0) {
      setError('Add at least one question with 2+ options')
      setSaving(false)
      return
    }

    const { error: err } = await supabase.from('polls').insert({
      campaign_id: campaignId,
      title,
      description: description || null,
      questions: cleanedQuestions,
      sent_count: sentCount ? parseInt(sentCount) : null,
    })

    if (err) { setError(err.message); setSaving(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-white">Create New Poll</h1>
        <p className="text-white/40 text-sm mt-1">Define the questions and answer options for this poll</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm">Poll Details</h2>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Title</label>
            <Input placeholder="Healthcare Poll — October 2026" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Description (optional)</label>
            <Textarea placeholder="Brief description of this poll's purpose" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Contacts Sent To (for response rate)</label>
            <Input type="number" placeholder="1500" value={sentCount} onChange={e => setSentCount(e.target.value)} />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <h2 className="font-semibold text-white text-sm">Questions</h2>
          {questions.map((q, qi) => (
            <div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-white/40 mt-2.5 shrink-0">Q{qi + 1}</span>
                <Input
                  placeholder="What is your position on the proposed healthcare bill?"
                  value={q.text}
                  onChange={e => updateQuestion(q.id, e.target.value)}
                  className="flex-1"
                />
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(q.id)} className="mt-2 text-white/30 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="ml-6 space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-white/30 w-4">{oi + 1}.</span>
                    <Input
                      placeholder={`Option ${oi + 1}`}
                      value={opt}
                      onChange={e => updateOption(q.id, oi, e.target.value)}
                      className="h-8 text-sm"
                    />
                    {q.options.length > 2 && (
                      <button type="button" onClick={() => removeOption(q.id, oi)} className="text-white/30 hover:text-red-400">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(q.id)}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors ml-5 mt-1"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add option
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <PlusCircle className="h-4 w-4" /> Add question
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Poll'}</Button>
        </div>
      </form>
    </div>
  )
}
