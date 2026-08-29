export default function FamilyNotLinkedState() {
  return (
    <div className="px-4 max-w-md md:max-w-2xl mx-auto pt-10">
      <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
        <p className="text-sm font-medium text-ink">
          Tu cuenta todavía no está vinculada a ningún alumno
        </p>
        <p className="text-xs text-prose mt-2">
          Contacta al colegio para vincular tu cuenta con tu hijo/a.
        </p>
      </div>
    </div>
  )
}
