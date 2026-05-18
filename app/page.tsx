import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-xl text-white">CampaignAnalyzer</span>
        <div className="flex gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm">Create Account</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1D4ED8]/40 bg-[#1D4ED8]/10 px-4 py-1.5 text-xs text-blue-300 mb-8">
            Powered by Claude AI
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-white mb-6 leading-tight">
            Poll Intelligence for
            <span className="text-[#1D4ED8]"> Modern Campaigns</span>
          </h1>
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
            Collect Twilio poll responses, uncover AI-detected voter correlations, and receive
            strategic memos — all in one secure, multi-campaign platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto">Create Account</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">Sign In</Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Feature grid */}
      <section className="border-t border-white/10 px-6 py-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Raw Statistics',
              desc: 'Interactive bar charts, filterable response tables, and CSV export for every question in your poll.',
            },
            {
              title: 'AI Correlations',
              desc: 'Claude identifies cross-question and demographic patterns your team would never find manually.',
            },
            {
              title: 'Strategic Memos',
              desc: 'Get a full political strategist memo — segmentation, messaging, outreach priorities, and risk flags.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-serif text-lg text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-white/30">
        CampaignAnalyzer — Poll Intelligence Platform
      </footer>
    </div>
  )
}
