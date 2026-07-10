import Link from 'next/link'
import { Users, ClipboardList, BookOpen, Receipt } from 'lucide-react'
import { getStudentPage } from '@/features/students/api'
import { getAcademicYears } from '@/features/academic-years/api'
import { getMe } from '@/features/auth/actions'
import TenantDashboardStats from '@/features/tenant/components/TenantDashboardStats'
import RecentStudents from '@/features/students/components/RecentStudents'
import type { UserRole } from '@/shared/store/session'

const QUICK_ACTIONS = [
  { href: '/students', icon: Users, label: 'Estudiantes', desc: 'Gestiona tu alumnado', roles: ['ADMIN', 'TEACHER'] as UserRole[] },
  { href: '/attendance', icon: ClipboardList, label: 'Asistencia', desc: 'Control diario', roles: ['ADMIN', 'TEACHER'] as UserRole[] },
  { href: '/academic-years', icon: BookOpen, label: 'Académico', desc: 'Años y períodos', roles: ['ADMIN', 'TEACHER'] as UserRole[] },
  { href: '/billing', icon: Receipt, label: 'Cobros', desc: 'Pagos e invoices', roles: ['ADMIN', 'TREASURER'] as UserRole[] },
]

export default async function DashboardPage() {
  const session = await getMe()
  const quickActions = QUICK_ACTIONS.filter((a) => session && a.roles.includes(session.user.role))

  const [allStudents, activeStudents, years] = await Promise.all([
    getStudentPage({ page: 0, size: 6 }).catch(() => null),
    getStudentPage({ page: 0, size: 1, status: 'ACTIVE' }).catch(() => null),
    getAcademicYears().catch(() => [] as Awaited<ReturnType<typeof getAcademicYears>>),
  ])

  const activeYear = years.find((y) => y.active) ?? null

  return (
    <div className="flex flex-col gap-6 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-medium text-ink">Dashboard</h1>
          <p className="text-prose text-sm mt-0.5">Resumen del colegio</p>
        </div>
      </div>

      <TenantDashboardStats
        totalStudents={allStudents?.totalElements ?? 0}
        activeStudents={activeStudents?.totalElements ?? 0}
        activeYear={activeYear}
      />

      {/* Quick actions */}
      {quickActions.length > 0 && (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickActions.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-card hover:-translate-y-1 hover:shadow-hover transition-all duration-300"
          >
            <div className="w-10 h-10 bg-muted-fill rounded-xl flex items-center justify-center group-hover:bg-accent/40 transition-colors duration-300">
              <Icon size={20} className="text-ink/70 group-hover:text-ink transition-colors duration-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{label}</p>
              <p className="text-xs text-prose mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-prose">Estudiantes recientes</h2>
          <Link href="/students" className="text-xs text-ink/60 hover:text-ink transition-colors underline-offset-2 hover:underline">
            Ver todos →
          </Link>
        </div>
        <RecentStudents students={allStudents?.content ?? []} />
      </div>
    </div>
  )
}
