'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newTenantSchema, type NewTenantInput } from '../schemas'
import { createTenant } from '../actions'
import type { Plan, TenantProvisionResponse } from '../types'
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

interface Props {
  plans: Plan[]
}

export default function NewTenantForm({ plans }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<TenantProvisionResponse | null>(null)

  const form = useForm<NewTenantInput>({
    resolver: zodResolver(newTenantSchema),
    defaultValues: {
      subdomain: '',
      name: '',
      planId: plans[0]?.id ?? 0,
      trialDays: 30,
      adminEmail: '',
      adminFirstName: '',
      adminLastName: '',
    },
  })

  function onSubmit(values: NewTenantInput) {
    startTransition(async () => {
      try {
        const data = await createTenant({
          ...values,
          trialDays: values.trialDays ?? undefined,
        })
        setResult(data)
      } catch (err) {
        form.setError('root', {
          message: err instanceof Error ? err.message : 'Error al crear el colegio',
        })
      }
    })
  }

  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-accent bg-accent/20 p-6">
          <h2 className="font-medium text-ink text-lg mb-1">
            Colegio creado exitosamente
          </h2>
          <p className="text-sm text-prose mb-4">
            Comparte esta contraseña temporal con el administrador. No podrás verla de nuevo.
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ghost">Colegio</p>
            <p className="font-medium text-ink">{result.tenant.name}</p>
            <p className="text-sm text-ghost mt-2">Subdominio</p>
            <code className="text-sm font-mono bg-white border border-line rounded-xl px-3 py-1.5 w-fit text-ink">
              {result.tenant.subdomain}
            </code>
            <p className="text-sm text-ghost mt-2">Contraseña temporal del admin</p>
            <code className="text-lg font-mono bg-ink text-accent rounded-xl px-4 py-2.5 tracking-widest w-fit">
              {result.tempPassword}
            </code>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push('/platform/dashboard')}>
          Volver al dashboard
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del colegio</FormLabel>
                <FormControl>
                  <Input placeholder="Colegio San Martín" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subdomain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subdominio</FormLabel>
                <FormControl>
                  <Input placeholder="colegio-san-martin" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="planId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan</FormLabel>
                <FormControl>
                  <select
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/70 focus:border-accent transition-all duration-200"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trialDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Días de trial</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    placeholder="30"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t border-line pt-5">
          <p className="text-sm font-medium text-prose mb-4">Administrador inicial</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <FormField
              control={form.control}
              name="adminEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@colegio.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminFirstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminLastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {form.formState.errors.root && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-2.5">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/platform/dashboard')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creando...' : 'Crear colegio'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
