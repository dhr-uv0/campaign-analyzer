import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/dashboard/nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: memberships } = await supabase
    .from('campaign_members')
    .select('campaign_id, role, campaigns(id, name, join_code)')
    .eq('user_id', user.id)

  const campaigns = (memberships ?? [])
    .map(m => m.campaigns as { id: string; name: string; join_code: string } | null)
    .filter(Boolean) as { id: string; name: string; join_code: string }[]

  if (campaigns.length === 0) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col">
      <DashboardNav campaigns={campaigns} userId={user.id} />
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
