import Link from 'next/link'
import { getTenants } from '@/features/platform/api'
import StatsCards from '@/features/platform/components/StatsCards'
import TenantTable from '@/features/platform/components/TenantTable'

export default async function PlatformDashboardPage() {
  const tenants = await getTenants().catch(() => [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-ink">Colegios</h1>
          <p className="text-prose text-sm mt-0.5">Gestión de colegios en la plataforma</p>
        </div>
        <Link
          href="/platform/tenants/new"
          className="inline-flex items-center gap-1.5 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-card"
        >
          + Nuevo colegio
        </Link>
      </div>

      <StatsCards tenants={tenants} />

      <div>
        <h2 className="text-sm font-medium text-prose mb-3">
          Todos los colegios ({tenants.length})
        </h2>
        <TenantTable tenants={tenants} />
      </div>
    </div>
  )
}
