'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '../schemas'
import { login } from '../actions'
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

export default function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const setSession = useSession((s) => s.setSession)
  const [isPending, startTransition] = useTransition()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      subdomain: params.get('subdomain') ?? '',
      email: '',
      password: '',
    },
  })

  function onSubmit(values: LoginInput) {
    startTransition(async () => {
      try {
        const result = await login(values.subdomain, {
          email: values.email,
          password: values.password,
        })

        if (!result.ok) {
          router.push(
            `/auth/change-password?email=${encodeURIComponent(result.email)}&subdomain=${values.subdomain}`
          )
          return
        }

        setSession(result.user, values.subdomain)
        router.push('/dashboard')
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
          name="subdomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colegio (subdominio)</FormLabel>
              <FormControl>
                <Input placeholder="mi-colegio" autoComplete="organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="admin@colegio.com" autoComplete="email" {...field} />
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
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
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
