'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'

export function Hero() {
  const [searchQuery, setSearchQuery] = useState('')

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Ownership",
      description: "Blockchain-verified ownership with immutable records"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Trading",
      description: "Trustless transactions with smart contract automation"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Royalty System",
      description: "Earn ongoing royalties from your AI creations"
    }
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Main Heading */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              The Future of{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                AI Asset Ownership
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Mint, trade, and monetize your AI models, scripts, and datasets on the blockchain. 
              Own your creations, earn royalties, and build the decentralized AI economy.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search AI models, datasets, scripts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-32 h-14 text-lg"
              />
              <Button size="lg" className="absolute right-2 top-2 bottom-2">
                Search
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" asChild>
              <Link href="/create">
                Create Your First Asset
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/explore">
                Explore Marketplace
              </Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>
    </section>
  )
}