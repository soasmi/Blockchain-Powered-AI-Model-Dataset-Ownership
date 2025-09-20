import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Asset Marketplace',
  description: 'Blockchain-powered platform for AI model, script, and dataset ownership and monetization',
  keywords: ['AI', 'blockchain', 'marketplace', 'NFT', 'machine learning', 'datasets'],
  authors: [{ name: 'AI Asset Marketplace Team' }],
  openGraph: {
    title: 'AI Asset Marketplace',
    description: 'Blockchain-powered platform for AI model, script, and dataset ownership and monetization',
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
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}