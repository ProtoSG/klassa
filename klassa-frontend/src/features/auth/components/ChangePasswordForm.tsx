'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema, type ChangePasswordInput } from '../schemas'
import { changePassword } from '../actions'
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

export default function ChangePasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const setSession = useSession((s) => s.setSession)
  const email = params.get('email') ?? ''
  const subdomain = params.get('subdomain') ?? ''
  const [isPending, startTransition] = useTransition()

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  })

  function onSubmit(values: ChangePasswordInput) {
    startTransition(async () => {
      try {
        const user = await changePassword(subdomain, {
          email,
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
        setSession(user, subdomain)
        router.push('/dashboard')
      } catch (err) {
        form.setError('root', {
          message: err instanceof Error ? err.message : 'Error al cambiar contraseña',
        })
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña temporal</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contraseña</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
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
          {isPending ? 'Guardando...' : 'Establecer contraseña'}
        </Button>
      </form>
    </Form>
  )
}
