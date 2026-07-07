import { Suspense } from 'react'
import LoginForm from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-canvas">
      <div className="w-full max-w-sm">
        {/* Floating decorative elements */}
        <div className="relative mb-8">
          <div className="absolute -top-8 -right-8 w-16 h-16 bg-accent/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute -top-4 -left-6 w-8 h-8 bg-accent/20 rounded-full animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-2 right-0 w-5 h-5 bg-ink/10 rounded-full animate-float" style={{ animationDelay: '4s' }} />

          <div className="text-center relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-ink rounded-2xl mb-4 shadow-card">
              <span className="text-accent font-semibold text-xl">K</span>
            </div>
            <h1 className="text-2xl font-medium text-ink">Klassa</h1>
            <p className="text-prose mt-1 text-sm">Inicia sesión en tu colegio</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-line p-6 shadow-card">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
