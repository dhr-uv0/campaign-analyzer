'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const CampaignIdContext = createContext<string>('')
export const useCampaignId = () => useContext(CampaignIdContext)

export default function CampaignIdProvider({
  children,
  campaignId,
}: {
  children: React.ReactNode
  campaignId: string
}) {
  const [id, setId] = useState(campaignId)

  useEffect(() => {
    const stored = localStorage.getItem('activeCampaignId')
    if (stored) setId(stored)
  }, [])

  return <CampaignIdContext.Provider value={id}>{children}</CampaignIdContext.Provider>
}
