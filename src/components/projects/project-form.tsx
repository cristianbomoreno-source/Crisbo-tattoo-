'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import {
  createProjectSchema,
  type CreateProjectInput,
} from '@/lib/validations/projects'
import { createProjectAction } from '@/actions/projects'
import { InlineCreateClient } from '@/components/clients/inline-create-client'
import type { Client } from '@/queries/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export function ProjectForm({ clients, onSuccess }: { clients: Client[]; onSuccess?: () => void }) {
  const router = useRouter()
  const [clientList, setClientList] = useState(clients)
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema) as Resolver<CreateProjectInput>,
    defaultValues: { name: '', client_id: '', notes: '' },
  })

  async function onSubmit(values: CreateProjectInput) {
    const result = await createProjectAction(values)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Proyecto creado')
    onSuccess?.()
    // Lleva al detalle del nuevo proyecto para poder agendar sus sesiones.
    router.push(`/dashboard/projects/${result.data.id}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del proyecto</FormLabel>
              <FormControl>
                <Input placeholder="Manga japonesa — Dragón koi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="client_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select
                items={Object.fromEntries(clientList.map((c) => [c.id, c.name]))}
                value={field.value || null}
                onValueChange={(v) => field.onChange(v ?? '')}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clientList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2">
                <InlineCreateClient
                  onCreated={(c) => {
                    setClientList((l) => [c, ...l])
                    field.onChange(c.id)
                  }}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="total_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor total (COP)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anticipo (COP)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Detalles, referencias, ubicación del tatuaje…"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creando…' : 'Crear proyecto'}
        </Button>
      </form>
    </Form>
  )
}
