import { Users, ClipboardList, BookOpen, Receipt, Shield, Building2 } from 'lucide-react'

const FEATURES = [
  {
    icon: Users,
    title: 'Gestión de alumnos',
    description: 'Fichas completas con datos personales, historial académico, acudientes y estado de matrícula.',
    tags: ['Matrícula', 'Historial', 'Acudientes'],
    dark: false,
  },
  {
    icon: ClipboardList,
    title: 'Control de asistencia',
    description: 'Registro diario rápido por curso. Reportes de inasistencias y estadísticas en tiempo real.',
    tags: ['Registro diario', 'Reportes', 'Alertas'],
    dark: true,
  },
  {
    icon: BookOpen,
    title: 'Años académicos',
    description: 'Configura períodos, niveles y cursos. Gestiona el calendario académico de tu institución.',
    tags: ['Períodos', 'Niveles', 'Cursos'],
    dark: false,
  },
  {
    icon: Receipt,
    title: 'Cobros y facturación',
    description: 'Genera cobros, lleva el estado de cuenta de cada familia y descarga reportes de pagos.',
    tags: ['Pagos', 'Estado de cuenta', 'Reportes'],
    dark: true,
  },
  {
    icon: Shield,
    title: 'Gestión de usuarios',
    description: 'Administra roles y permisos. Cada usuario accede únicamente a lo que necesita.',
    tags: ['Roles', 'Permisos', 'Accesos'],
    dark: false,
  },
  {
    icon: Building2,
    title: 'Multi-institución',
    description: 'Cada colegio tiene su propio subdominio y base de datos. Aislamiento total de datos.',
    tags: ['Subdominio', 'Aislado', 'Seguro'],
    dark: true,
  },
]

export default function Features() {
  return (
    <section id="caracteristicas" className="py-24 bg-canvas">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-1.5 bg-muted-fill border border-line text-xs font-medium text-prose px-3 py-1.5 rounded-full mb-4">
            Características
          </span>
          <h2 className="text-4xl font-medium text-ink">
            Todo bajo control, siempre
          </h2>
          <p className="text-prose mt-3 text-lg max-w-xl mx-auto leading-relaxed">
            Módulos diseñados para el flujo real de trabajo de un colegio, no para complicarte la vida.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description, tags, dark }) => (
            <div
              key={title}
              className="group bg-white/50 rounded-2xl p-8 border border-line hover:bg-white/80 hover:-translate-y-2 hover:shadow-hover transition-all duration-300 cursor-default"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                  dark ? 'bg-ink' : 'bg-accent'
                }`}
              >
                <Icon size={22} className={dark ? 'text-accent' : 'text-ink'} />
              </div>
              <h3 className="text-lg font-medium text-ink mb-2">{title}</h3>
              <p className="text-prose text-sm leading-relaxed">{description}</p>
              <div className="flex flex-wrap gap-1.5 mt-5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted-fill text-ghost text-xs px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
