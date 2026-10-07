'use client'

import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import {
  createClientSchema,
  type CreateClientInput,
} from '@/lib/validations/clients'
import { createClientAction, updateClientAction } from '@/actions/clients'
import type { Client } from '@/queries/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PhoneInput } from '@/components/shared/phone-input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface ClientFormProps {
  client?: Client
  onSuccess?: () => void
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const router = useRouter()
  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema) as Resolver<CreateClientInput>,
    defaultValues: {
      name: client?.name ?? '',
      phone: client?.phone ?? '',
      email: client?.email ?? '',
      instagram: client?.instagram ?? '',
      notes: client?.notes ?? '',
    },
  })

  async function onSubmit(values: CreateClientInput) {
    const result = client
      ? await updateClientAction(client.id, values)
      : await createClientAction(values)

    if (!result.success) {
      toast.error(result.error.message)
      return
    }

    toast.success(client ? 'Cliente actualizado' : 'Cliente creado')
    if (onSuccess) onSuccess()
    else {
      router.push('/dashboard/clients')
      router.refresh()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Camila Restrepo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp / Teléfono</FormLabel>
              <FormControl>
                <PhoneInput
                  id="client-phone"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
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
                <Input type="email" placeholder="cliente@correo.com" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instagram"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram</FormLabel>
              <FormControl>
                <Input placeholder="@usuario" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Alergias, preferencias, antecedentes…" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? 'Guardando…'
            : client
              ? 'Actualizar cliente'
              : 'Crear cliente'}
        </Button>
      </form>
    </Form>
  )
}
