'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, BarChart2, Users, Settings, LogOut, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Campaign { id: string; name: string; join_code: string }

export default function DashboardNav({
  campaigns,
  userId,
}: {
  campaigns: Campaign[]
  userId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Active campaign: stored in localStorage or first campaign
  const [activeCampaignId, setActiveCampaignId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeCampaignId') ?? campaigns[0]?.id ?? ''
    }
    return campaigns[0]?.id ?? ''
  })

  const active = campaigns.find(c => c.id === activeCampaignId) ?? campaigns[0]

  function switchCampaign(id: string) {
    setActiveCampaignId(id)
    if (typeof window !== 'undefined') localStorage.setItem('activeCampaignId', id)
    setOpen(false)
    router.refresh()
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navLinks = [
    { href: '/dashboard', label: 'Polls', icon: BarChart2 },
    { href: '/dashboard/contacts', label: 'Contacts', icon: Users },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <header className="border-b border-white/10 px-6 py-3 flex items-center gap-6 bg-[#0f1f38]">
      <span className="font-serif text-lg text-white whitespace-nowrap">CampaignAnalyzer</span>

      {/* Campaign switcher */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white rounded-md px-3 py-1.5 border border-white/10 hover:border-white/20 transition-colors"
        >
          <span className="max-w-[160px] truncate">{active?.name ?? 'Select campaign'}</span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-white/10 bg-[#0f1f38] shadow-xl z-50 py-1">
            {campaigns.map(c => (
              <button
                key={c.id}
                onClick={() => switchCampaign(c.id)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors',
                  c.id === activeCampaignId ? 'text-blue-400' : 'text-white/70'
                )}
              >
                {c.name}
              </button>
            ))}
            <div className="border-t border-white/10 mt-1 pt-1">
              <Link
                href="/onboarding"
                className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                <PlusCircle className="h-3.5 w-3.5" /> New campaign
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-1 flex-1">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                ? 'text-white bg-white/10'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={signOut}
        className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </header>
  )
}
