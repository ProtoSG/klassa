import Link from 'next/link'

const LINKS = {
  Producto: [
    { label: 'Características', href: '#caracteristicas' },
    { label: 'Estadísticas', href: '#estadisticas' },
    { label: 'Solicitar demo', href: '#demo' },
    { label: 'Iniciar sesión', href: '/auth/login' },
  ],
  Plataforma: [
    { label: 'Panel de colegios', href: '/platform/login' },
    { label: 'Cambiar contraseña', href: '/auth/change-password' },
  ],
  Legal: [
    { label: 'Privacidad', href: '#' },
    { label: 'Términos de uso', href: '#' },
  ],
}

export default function LandingFooter() {
  return (
    <footer className="pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-trim rounded-2xl px-8 md:px-10 py-12">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-line">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center">
                <span className="text-accent font-semibold text-sm">K</span>
              </div>
              <span className="font-medium text-ink">Klassa</span>
              <span className="text-ghost text-sm ml-1">— ERP Escolar</span>
            </div>
            <Link
              href="#demo"
              className="inline-flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-2 rounded-xl hover:scale-105 transition-transform duration-300 w-fit"
            >
              Solicitar demo
            </Link>
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-b border-line">
            {Object.entries(LINKS).map(([category, items]) => (
              <div key={category}>
                <p className="text-xs font-medium text-ghost uppercase tracking-wide mb-3">
                  {category}
                </p>
                <ul className="flex flex-col gap-2">
                  {items.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm text-prose hover:text-ink transition-colors duration-200"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6">
            <p className="text-xs text-ghost">
              © {new Date().getFullYear()} Klassa. Sistema de gestión escolar.
            </p>
            <p className="text-xs text-ghost">
              Hecho con cuidado para las instituciones educativas
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
