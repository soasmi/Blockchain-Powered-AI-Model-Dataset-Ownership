import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Hero } from '@/components/home/Hero'
import { FeaturedAssets } from '@/components/home/FeaturedAssets'
import { Stats } from '@/components/home/Stats'
import { HowItWorks } from '@/components/home/HowItWorks'
import { Footer } from '@/components/layout/Footer'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Suspense fallback={<LoadingSpinner />}>
          <Hero />
          <Stats />
          <FeaturedAssets />
          <HowItWorks />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}