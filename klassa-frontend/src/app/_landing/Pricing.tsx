import { BACKEND_URL } from '@/shared/lib/constants'
import type { Plan } from '@/features/platform/types'
import PricingCards from './PricingCards'

async function getPublicPlans(): Promise<Plan[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/plans`, { cache: 'no-store' })
    if (!res.ok) return []
    const body = await res.json()
    return (body.data ?? []) as Plan[]
  } catch {
    return []
  }
}

export default async function Pricing() {
  const plans = (await getPublicPlans()).filter((p) => p.active)
  if (plans.length === 0) return null

  return (
    <section id="precios" className="py-24 bg-canvas">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 bg-muted-fill border border-line text-xs font-medium text-prose px-3 py-1.5 rounded-full mb-4">
            Precios
          </span>
          <h2 className="text-4xl font-medium text-ink">Simple y transparente</h2>
          <p className="text-prose mt-3 text-lg max-w-xl mx-auto leading-relaxed">
            Elige el plan que se adapta al tamaño de tu institución. Sin costos ocultos.
          </p>
        </div>

        <PricingCards plans={plans} />
      </div>
    </section>
  )
}
