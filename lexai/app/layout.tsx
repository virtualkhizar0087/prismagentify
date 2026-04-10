import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Court of AI — AI Legal Co-Pilot for Small Businesses',
    template: '%s | Court of AI',
  },
  description:
    'Analyze contracts, generate legal documents, and get instant legal guidance powered by AI. Built for small business owners.',
  keywords: ['legal AI', 'contract analysis', 'small business', 'NDA generator', 'legal documents'],
  openGraph: {
    title: 'Court of AI — AI Legal Co-Pilot for Small Businesses',
    description: 'Analyze contracts, generate legal documents, and get instant legal guidance powered by AI.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
