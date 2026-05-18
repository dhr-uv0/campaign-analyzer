import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CampaignAnalyzer — Poll Intelligence',
  description: 'Political poll intelligence platform for modern campaigns',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
