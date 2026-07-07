'use client'

import * as React from 'react'
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { cn } from '@/lib/utils'

export const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = { name: TName }

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

type FormItemContextValue = { id: string }
const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

export function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const id = React.useId()
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn('flex flex-col gap-1.5', className)} {...props} />
    </FormItemContext.Provider>
  )
}

export function FormLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { id } = React.useContext(FormItemContext)
  const { name } = React.useContext(FormFieldContext)
  const { formState: { errors } } = useFormContext()
  const hasError = !!errors[name]
  return (
    <label
      htmlFor={`${id}-input`}
      className={cn('text-sm font-medium text-ink', hasError && 'text-red-500', className)}
      {...props}
    />
  )
}

export function FormControl({ children }: { children: React.ReactElement }) {
  const { id } = React.useContext(FormItemContext)
  return React.cloneElement(children as React.ReactElement<{ id?: string }>, {
    id: `${id}-input`,
  })
}

export function FormMessage({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { name } = React.useContext(FormFieldContext)
  const { formState: { errors } } = useFormContext()
  const error = errors[name]
  const body = error ? String(error?.message ?? '') : children
  if (!body) return null
  return (
    <p className={cn('text-xs text-red-500', className)}>{body}</p>
  )
}
