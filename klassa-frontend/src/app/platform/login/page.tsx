import PlatformLoginForm from '@/features/platform/components/PlatformLoginForm'

export default function PlatformLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-canvas">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-ink rounded-2xl mb-4 shadow-card">
            <span className="text-accent font-semibold text-xl">K</span>
          </div>
          <h1 className="text-2xl font-medium text-ink">Klassa Platform</h1>
          <p className="text-prose mt-1 text-sm">Acceso de administrador</p>
        </div>

        <div className="bg-white rounded-2xl border border-line p-6 shadow-card">
          <PlatformLoginForm />
        </div>
      </div>
    </main>
  )
}
