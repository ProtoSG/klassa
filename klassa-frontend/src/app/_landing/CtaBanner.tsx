import Link from 'next/link'

export default function CtaBanner() {
  return (
    <section id="demo" className="py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-ink text-white rounded-3xl px-8 md:px-16 py-16 flex flex-col items-center gap-6 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-4 py-2 rounded-full">
            <div className="w-5 h-5 bg-accent rounded-md flex items-center justify-center">
              <span className="text-ink text-xs font-semibold">K</span>
            </div>
            Klassa ERP Escolar
          </span>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-medium max-w-2xl leading-tight">
            Empieza hoy con Klassa
          </h2>

          {/* Sub */}
          <p className="text-white/60 text-lg max-w-xl leading-relaxed">
            Configura tu colegio en minutos. Sin tarjeta de crédito. Sin contratos largos.
            Solo tu institución gestionada de forma inteligente.
          </p>

          {/* CTA */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-accent text-ink font-medium px-8 py-3.5 rounded-xl hover:scale-105 transition-transform duration-300 shadow-card"
          >
            Solicitar acceso →
          </Link>

          {/* Trust line */}
          <p className="text-white/30 text-sm">
            Período de prueba incluido · Soporte en español · Datos en la nube
          </p>
        </div>
      </div>
    </section>
  )
}
