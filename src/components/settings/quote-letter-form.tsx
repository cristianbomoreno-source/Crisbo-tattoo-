'use client'

import { useRouter } from 'next/navigation'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { updateQuoteLandingSchema, type UpdateQuoteLandingInput } from '@/lib/validations/studio'
import { updateQuoteLandingSettings } from '@/actions/studio'
import { DEFAULT_LETTER_MESSAGE } from '@/lib/pdf/quote-template-data'
import { SettingsSubpage, SettingsSaveBar } from '@/components/settings/settings-subpage'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

export function QuoteLetterForm({
  letterMessage,
  priceNegotiable,
}: {
  letterMessage: string | null
  priceNegotiable: boolean
}) {
  const router = useRouter()
  const form = useForm<UpdateQuoteLandingInput>({
    resolver: zodResolver(updateQuoteLandingSchema) as Resolver<UpdateQuoteLandingInput>,
    defaultValues: {
      quote_letter_message: letterMessage ?? '',
      quote_price_negotiable: priceNegotiable,
    },
  })

  async function onSubmit(values: UpdateQuoteLandingInput) {
    const result = await updateQuoteLandingSettings(values)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Guardado')
    form.reset(values)
    router.refresh()
  }

  return (
    <SettingsSubpage
      title="Carta y negociación"
      description="La carta que ve tu cliente en la landing del proyecto y si permites que proponga otro valor."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="quote_letter_message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carta del tatuador</FormLabel>
                <p className="mb-2 text-xs text-muted-foreground">
                  Se muestra como una carta en la landing del proyecto. Vacío = usa la plantilla por defecto.
                  Placeholder disponible: {'{nombre_cliente}'}.
                </p>
                <FormControl>
                  <Textarea rows={9} placeholder={DEFAULT_LETTER_MESSAGE} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Controller
            control={form.control}
            name="quote_price_negotiable"
            render={({ field }) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-background/40 p-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    Permitir que el cliente proponga otro valor
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Agrega un botón en la landing del proyecto: el cliente escribe su presupuesto y le
                    genera un mensaje de WhatsApp para ti con la propuesta.
                  </span>
                </span>
              </label>
            )}
          />

          <SettingsSaveBar
            dirty={form.formState.isDirty}
            saving={form.formState.isSubmitting}
            onSave={form.handleSubmit(onSubmit)}
          />
        </form>
      </Form>
    </SettingsSubpage>
  )
}
