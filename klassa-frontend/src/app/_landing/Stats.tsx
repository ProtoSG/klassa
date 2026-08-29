const SUB_STATS = [
  { value: '100%', label: 'Cloud nativo' },
  { value: '< 1s', label: 'Tiempo de respuesta' },
  { value: '24/7', label: 'Disponibilidad' },
]

export default function Stats() {
  return (
    <section
      id="estadisticas"
      className="py-24 bg-accent/15"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Large card */}
          <div className="md:col-span-2 bg-white rounded-2xl p-8 md:p-12 shadow-card border border-line">
            <span className="inline-flex items-center gap-1.5 bg-accent/30 text-ink text-xs font-medium px-3 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-ink/50" />
              Plataforma completa
            </span>
            <h2 className="text-3xl md:text-4xl font-medium text-ink max-w-xl leading-tight">
              Todo lo que tu colegio necesita en un solo lugar
            </h2>
            <p className="text-prose mt-3 max-w-2xl leading-relaxed">
              Desde la matrícula hasta los cobros, Klassa integra cada proceso de tu institución.
              Sin hojas de cálculo, sin papel, sin caos.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-line">
              {SUB_STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-2xl font-medium text-ink">{value}</p>
                  <p className="text-sm text-prose mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dark card */}
          <div className="bg-ink text-white rounded-2xl p-8 shadow-card hover:-translate-y-1 hover:shadow-hover transition-all duration-300">
            <p className="text-white/50 text-sm font-medium mb-2">Estudiantes gestionados</p>
            <p className="text-5xl font-medium">500<span className="text-accent">+</span></p>
            <p className="text-white/50 text-sm mt-3 leading-relaxed">
              Fichas de alumnos con historial, acudientes y estado académico
            </p>
          </div>

          {/* Light card */}
          <div className="bg-white rounded-2xl p-8 shadow-card border border-line hover:-translate-y-1 hover:shadow-hover transition-all duration-300">
            <p className="text-ghost text-sm font-medium mb-2">Colegios en plataforma</p>
            <p className="text-5xl font-medium text-ink">50<span className="text-prose">+</span></p>
            <p className="text-prose text-sm mt-3 leading-relaxed">
              Instituciones que confían en Klassa para su gestión diaria
            </p>
            <div className="mt-4 flex -space-x-2">
              {['SM', 'LA', 'SJ', 'CV', 'IN'].map((init) => (
                <div
                  key={init}
                  className="w-8 h-8 rounded-full bg-muted-fill border-2 border-white flex items-center justify-center"
                >
                  <span className="text-xs font-medium text-prose">{init}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
