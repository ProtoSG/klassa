import type { TenantResponse } from '../types'

interface Props {
  tenants: TenantResponse[]
}

export default function StatsCards({ tenants }: Props) {
  const total = tenants.length
  const active = tenants.filter((t) => t.status === 'ACTIVE').length
  const trial = tenants.filter((t) => t.status === 'TRIAL').length
  const suspended = tenants.filter((t) => t.status === 'SUSPENDED').length

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded-2xl bg-ink text-white p-5 shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-300">
        <p className="text-xs font-medium text-white/50">Total colegios</p>
        <p className="mt-2 text-3xl font-medium">{total}</p>
      </div>

      <div className="rounded-2xl bg-white border border-line p-5 shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-300">
        <p className="text-xs font-medium text-ghost">Activos</p>
        <p className="mt-2 text-3xl font-medium text-ink">{active}</p>
        <div className="mt-2 inline-flex items-center gap-1 bg-accent/30 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className="text-xs text-ink/70">en línea</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-line p-5 shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-300">
        <p className="text-xs font-medium text-ghost">En trial</p>
        <p className="mt-2 text-3xl font-medium text-ink">{trial}</p>
        <div className="mt-2 inline-flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full">
          <span className="text-xs text-amber-700">período de prueba</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-line p-5 shadow-card hover:-translate-y-0.5 hover:shadow-hover transition-all duration-300">
        <p className="text-xs font-medium text-ghost">Suspendidos</p>
        <p className="mt-2 text-3xl font-medium text-prose">{suspended}</p>
      </div>
    </div>
  )
}
