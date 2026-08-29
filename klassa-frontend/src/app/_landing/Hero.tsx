import Link from 'next/link'
import { Users, ClipboardList, Receipt, BookOpen, CheckCircle } from 'lucide-react'

const PILLS = [
  { icon: Users, label: 'Gestión de alumnos' },
  { icon: ClipboardList, label: 'Asistencia diaria' },
  { icon: Receipt, label: 'Cobros y pagos' },
  { icon: BookOpen, label: 'Años académicos' },
]

const PREVIEW_STATS = [
  { label: 'Total alumnos', value: '248' },
  { label: 'Activos', value: '231' },
  { label: 'Año', value: '2025' },
]

const PREVIEW_MODULES = [
  'Gestión de alumnos',
  'Control de asistencia',
  'Cobros y facturación',
  'Años académicos',
]

export default function Hero() {
  return (
    <section
      id="inicio"
      className="max-w-7xl mx-auto px-6 md:px-10 pt-36 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
    >
      {/* Left column */}
      <div className="flex flex-col gap-7">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-card w-fit">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-medium text-ink">Gestión escolar inteligente</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl lg:text-[58px] font-medium text-ink leading-[1.05] tracking-[-0.5px]">
          Administra tu colegio{' '}
          <span className="relative inline-block">
            sin complicaciones
            <svg
              aria-hidden
              className="absolute -bottom-2 left-0 w-full"
              viewBox="0 0 300 12"
              fill="none"
            >
              <path
                d="M4 8 Q75 2 150 7 Q225 12 296 6"
                stroke="rgb(216,249,184)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-lg text-prose leading-relaxed max-w-xl">
          Klassa centraliza alumnos, asistencia, cobros y años académicos en una sola plataforma.
          Cada colegio con su propio espacio, seguro y siempre disponible.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2">
          {PILLS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 bg-muted-fill border border-line rounded-lg px-3 py-2 text-sm font-medium text-ink"
            >
              <Icon size={14} className="text-prose shrink-0" />
              {label}
            </span>
          ))}
        </div>

        {/* CTA row */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="#demo"
            className="inline-flex items-center gap-2 bg-ink text-white rounded-xl px-6 py-3 font-medium hover:scale-105 transition-transform duration-300 shadow-card"
          >
            Solicitar demo
          </Link>
          <a
            href="#caracteristicas"
            className="inline-flex items-center gap-2 bg-white border-2 border-trim text-ink rounded-xl px-6 py-3 font-medium hover:scale-105 transition-transform duration-300"
          >
            Ver características ↓
          </a>
        </div>

        {/* Trust */}
        <p className="text-sm text-ghost">
          Únete a los colegios que ya gestionan su institución con Klassa
        </p>
      </div>

      {/* Right column — visual composition */}
      <div className="relative flex items-center justify-center min-h-[420px] lg:min-h-[500px]">
        {/* Floating decorations */}
        <div
          className="absolute top-8 left-4 w-14 h-14 bg-accent rounded-2xl flex items-center justify-center shadow-card animate-float"
          style={{ animationDelay: '0s' }}
        >
          <Users size={22} className="text-ink" />
        </div>
        <div
          className="absolute top-4 right-8 w-10 h-10 bg-ink rounded-xl flex items-center justify-center shadow-card animate-float"
          style={{ animationDelay: '1.5s' }}
        >
          <CheckCircle size={16} className="text-accent" />
        </div>
        <div
          className="absolute bottom-16 left-0 w-8 h-8 bg-accent/50 rounded-full animate-float"
          style={{ animationDelay: '3s' }}
        />
        <div
          className="absolute bottom-8 right-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-card animate-float"
          style={{ animationDelay: '2s' }}
        >
          <Receipt size={18} className="text-ink" />
        </div>
        <div
          className="absolute top-1/2 left-2 -translate-y-1/2 w-6 h-6 bg-accent rounded-full animate-float"
          style={{ animationDelay: '4s' }}
        />
        <div
          className="absolute top-1/3 right-2 w-5 h-5 bg-ink/10 rounded-full animate-float"
          style={{ animationDelay: '5s' }}
        />

        {/* Central preview card */}
        <div className="relative z-10 bg-white rounded-3xl p-6 shadow-hover border border-line w-full max-w-sm mx-auto">
          {/* Card header */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-ink text-xs font-semibold">K</span>
            </div>
            <div>
              <p className="text-xs font-medium text-ink leading-none">Klassa</p>
              <p className="text-xs text-ghost">colegio-san-martin</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 bg-accent/30 text-ink/70 text-xs px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-ink/50" />
              Activo
            </span>
          </div>

          {/* Stats chips */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {PREVIEW_STATS.map(({ label, value }) => (
              <div key={label} className="bg-muted-fill rounded-xl p-3 text-center">
                <p className="text-base font-medium text-ink">{value}</p>
                <p className="text-xs text-ghost mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Module list */}
          <div className="flex flex-col gap-2">
            {PREVIEW_MODULES.map((mod) => (
              <div key={mod} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 10 10" className="w-3 h-3">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="rgb(43,45,45)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
                <span className="text-sm text-ink">{mod}</span>
              </div>
            ))}
          </div>

          {/* CTA inside card */}
          <Link
            href="/auth/login"
            className="mt-5 flex items-center justify-center bg-ink text-white text-sm font-medium rounded-xl py-2.5 hover:scale-[1.02] transition-transform duration-300"
          >
            Acceder al panel →
          </Link>
        </div>
      </div>
    </section>
  )
}
