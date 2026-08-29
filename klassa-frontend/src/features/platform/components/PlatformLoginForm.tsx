'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { platformLoginSchema, type PlatformLoginInput } from '@/features/auth/schemas'
import { platformLogin } from '@/features/auth/actions'
import { useSession } from '@/shared/store/session'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function PlatformLoginForm() {
  const router = useRouter()
  const setSession = useSession((s) => s.setSession)
  const [isPending, startTransition] = useTransition()

  const form = useForm<PlatformLoginInput>({
    resolver: zodResolver(platformLoginSchema),
    defaultValues: { email: '', password: '' },
  })

  function onSubmit(values: PlatformLoginInput) {
    startTransition(async () => {
      try {
        const user = await platformLogin(values)
        setSession(user, 'platform')
        router.push('/platform/dashboard')
      } catch (err) {
        form.setError('root', {
          message: err instanceof Error ? err.message : 'Error al iniciar sesión',
        })
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="admin@klassa.io"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-2.5">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="mt-2 w-full">
          {isPending ? 'Ingresando...' : 'Iniciar sesión'}
        </Button>
      </form>
    </Form>
  )
}
