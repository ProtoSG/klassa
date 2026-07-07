import ChangePasswordForm from '@/features/auth/components/ChangePasswordForm'
import { Suspense } from 'react'

export default function ChangePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-canvas">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-ink rounded-2xl mb-4 shadow-card">
            <span className="text-accent font-semibold text-xl">K</span>
          </div>
          <h1 className="text-2xl font-medium text-ink">Cambiar contraseña</h1>
          <p className="text-prose mt-1 text-sm">
            Establece una nueva contraseña para continuar
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-line p-6 shadow-card">
          <Suspense>
            <ChangePasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
