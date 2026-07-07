import { getPlans } from '@/features/platform/api'
import NewTenantForm from '@/features/platform/components/NewTenantForm'

export default async function NewTenantPage() {
  const plans = await getPlans().catch(() => [])

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-medium text-ink">Nuevo colegio</h1>
        <p className="text-prose text-sm mt-0.5">
          Provisiona un nuevo tenant con su administrador inicial
        </p>
      </div>
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <NewTenantForm plans={plans} />
      </div>
    </div>
  )
}
