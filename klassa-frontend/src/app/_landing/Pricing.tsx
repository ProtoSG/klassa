import { Check } from 'lucide-react'
import Link from 'next/link'
import { BACKEND_URL } from '@/shared/lib/constants'
import type { Plan } from '@/features/platform/types'

const MODULE_LABELS: Record<string, string> = {
  students: 'Gestión de alumnos',
  attendance: 'Control de asistencia',
  scores: 'Calificaciones',
  billing: 'Cobros y facturación',
  reports: 'Reportes',
  api: 'Acceso API',
}

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

  const featuredIndex = plans.length === 3 ? 1 : 0

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

        <div className={`grid grid-cols-1 gap-4 items-start ${plans.length === 3 ? 'md:grid-cols-3' : plans.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'max-w-sm mx-auto'}`}>
          {plans.map((plan, i) => {
            const featured = i === featuredIndex
            const modules = (plan.features?.modules ?? []) as string[]
            const unlimited = plan.maxStudents >= 9999

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 flex flex-col gap-6 border transition-all duration-300 hover:-translate-y-1 ${
                  featured
                    ? 'bg-ink text-white border-ink shadow-hover'
                    : 'bg-white border-line shadow-card'
                }`}
              >
                {featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-ink text-xs font-medium px-4 py-1 rounded-full whitespace-nowrap">
                    Más popular
                  </span>
                )}

                <div>
                  <p className={`text-sm font-medium mb-3 ${featured ? 'text-white/60' : 'text-ghost'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-medium ${featured ? 'text-white' : 'text-ink'}`}>
                      S/ {Number(plan.priceMonthly).toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                    </span>
                    <span className={`mb-1 text-sm ${featured ? 'text-white/50' : 'text-ghost'}`}>/mes</span>
                  </div>
                  <p className={`text-sm mt-1 ${featured ? 'text-white/50' : 'text-ghost'}`}>
                    {unlimited ? 'Estudiantes ilimitados' : `Hasta ${plan.maxStudents.toLocaleString()} estudiantes`}
                  </p>
                </div>

                <div className={`border-t ${featured ? 'border-white/10' : 'border-line'}`} />

                <ul className="flex flex-col gap-3">
                  {modules.map((mod) => (
                    <li key={mod} className="flex items-center gap-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${featured ? 'bg-accent' : 'bg-accent/40'}`}>
                        <Check size={11} className="text-ink" strokeWidth={2.5} />
                      </span>
                      <span className={`text-sm ${featured ? 'text-white/80' : 'text-prose'}`}>
                        {MODULE_LABELS[mod] ?? mod}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="#demo"
                  className={`mt-auto flex items-center justify-center rounded-xl py-3 text-sm font-medium transition-transform duration-300 hover:scale-105 ${
                    featured
                      ? 'bg-accent text-ink'
                      : 'border-2 border-trim text-ink bg-white hover:bg-muted-fill'
                  }`}
                >
                  Solicitar demo →
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
