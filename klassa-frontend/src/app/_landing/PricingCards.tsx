'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import Link from 'next/link'
import type { Plan } from '@/features/platform/types'

const MODULE_LABELS: Record<string, string> = {
  students: 'Gestión de alumnos',
  attendance: 'Control de asistencia',
  scores: 'Calificaciones',
  billing: 'Cobros y facturación',
  reports: 'Reportes',
  api: 'Acceso API',
}

// Marketing-only discount for annual billing (display purposes; no backend
// billing-cycle concept exists yet — CTA still routes to demo request).
const ANNUAL_MONTHS_CHARGED = 10

export default function PricingCards({ plans }: { plans: Plan[] }) {
  const [annual, setAnnual] = useState(false)
  const featuredIndex = plans.length === 3 ? 1 : 0

  return (
    <>
      <div className="flex items-center justify-center gap-3 mb-14">
        <span className={`text-sm font-medium transition-colors ${!annual ? 'text-ink' : 'text-ghost'}`}>
          Mensual
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          aria-label="Alternar entre facturación mensual y anual"
          onClick={() => setAnnual((v) => !v)}
          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
            annual ? 'bg-ink' : 'bg-trim'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
              annual ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-sm font-medium flex items-center gap-2 transition-colors ${annual ? 'text-ink' : 'text-ghost'}`}>
          Anual
          <span className="inline-flex items-center bg-accent/40 text-ink text-xs font-medium px-2 py-0.5 rounded-full">
            2 meses gratis
          </span>
        </span>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 items-stretch ${
          plans.length === 3 ? 'md:grid-cols-3' : plans.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'max-w-sm mx-auto'
        }`}
      >
        {plans.map((plan, i) => {
          const featured = i === featuredIndex
          const modules = (plan.features?.modules ?? []) as string[]
          const unlimited = plan.maxStudents >= 9999
          const monthlyPrice = Number(plan.priceMonthly)
          const displayPrice = annual ? Math.round((monthlyPrice * ANNUAL_MONTHS_CHARGED) / 12) : monthlyPrice
          const annualTotal = monthlyPrice * ANNUAL_MONTHS_CHARGED

          return (
            <div
              key={plan.id}
              className={`relative h-full rounded-2xl p-8 flex flex-col gap-6 border transition-all duration-300 ${
                featured
                  ? 'bg-ink text-white border-ink shadow-hover md:scale-[1.03] md:-translate-y-2 md:hover:-translate-y-3 hover:-translate-y-1 z-10'
                  : 'bg-white border-line shadow-card hover:shadow-hover hover:-translate-y-1'
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
                  <span className={`text-4xl font-medium tabular-nums ${featured ? 'text-white' : 'text-ink'}`}>
                    S/ {displayPrice.toLocaleString('es-PE', { minimumFractionDigits: 0 })}
                  </span>
                  <span className={`mb-1 text-sm ${featured ? 'text-white/50' : 'text-ghost'}`}>/mes</span>
                </div>
                <p className={`text-sm mt-1 min-h-5 ${featured ? 'text-white/50' : 'text-ghost'}`}>
                  {annual
                    ? `Facturado S/ ${annualTotal.toLocaleString('es-PE')} al año`
                    : unlimited
                      ? 'Estudiantes ilimitados'
                      : `Hasta ${plan.maxStudents.toLocaleString('es-PE')} estudiantes`}
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
                {!unlimited && annual && (
                  <li className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${featured ? 'bg-accent' : 'bg-accent/40'}`}>
                      <Check size={11} className="text-ink" strokeWidth={2.5} />
                    </span>
                    <span className={`text-sm ${featured ? 'text-white/80' : 'text-prose'}`}>
                      Hasta {plan.maxStudents.toLocaleString('es-PE')} estudiantes
                    </span>
                  </li>
                )}
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
    </>
  )
}
