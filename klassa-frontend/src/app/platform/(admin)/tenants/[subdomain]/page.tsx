import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTenantBySubdomain, getPlans } from '@/features/platform/api'
import TenantDetailClient from '@/features/platform/components/TenantDetailClient'

interface Props {
  params: Promise<{ subdomain: string }>
}

export default async function TenantDetailPage({ params }: Props) {
  const { subdomain } = await params
  const [tenant, plans] = await Promise.all([
    getTenantBySubdomain(subdomain).catch(() => null),
    getPlans().catch(() => []),
  ])

  if (!tenant) notFound()

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/platform/dashboard"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-line bg-white text-prose hover:text-ink hover:border-ink/20 transition-all duration-200 shrink-0"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-medium text-ink truncate">{tenant.name}</h1>
          <p className="text-prose text-sm mt-0.5 font-mono">{tenant.subdomain}</p>
        </div>
      </div>

      <TenantDetailClient tenant={tenant} plans={plans} />
    </div>
  )
}
