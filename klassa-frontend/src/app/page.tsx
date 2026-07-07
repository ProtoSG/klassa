import LandingNav from './_landing/LandingNav'
import Hero from './_landing/Hero'
import Stats from './_landing/Stats'
import Features from './_landing/Features'
import Pricing from './_landing/Pricing'
import CtaBanner from './_landing/CtaBanner'
import LandingFooter from './_landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <LandingNav />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Pricing />
        <CtaBanner />
      </main>
      <LandingFooter />
    </div>
  )
}
