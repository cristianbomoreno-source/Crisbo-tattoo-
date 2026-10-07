'use client'

import { useRouter } from 'next/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { updateMessageTemplatesSchema, type UpdateMessageTemplatesInput } from '@/lib/validations/studio'
import { updateMessageTemplates } from '@/actions/studio'
import {
  DEFAULT_QUOTE_TEMPLATE,
  DEFAULT_BALANCE_TEMPLATE,
  DEFAULT_SESSION_TEMPLATE,
  DEFAULT_CONTACT_TEMPLATE,
  DEFAULT_BOT_CONTACT_TEMPLATE,
  DEFAULT_QUOTE_CONFIRM_TEMPLATE,
  DEFAULT_BOOKING_CONFIRMATION_TEMPLATE,
} from '@/lib/messages/templates'
import { SettingsSubpage, SettingsSaveBar } from '@/components/settings/settings-subpage'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

/** Una plantilla editable: nombre del campo del form, título, dónde se usa,
 * los placeholders válidos para ESA plantilla en particular (cada una tiene
 * los suyos, no todos aplican a todas) y el texto de ejemplo/por defecto que
 * se restaura con "Usar ejemplo". */
const TEMPLATES = [
  {
    name: 'quote_message_template' as const,
    label: 'Mensaje de cotización',
    where: 'Se envía al mandarle una cotización a un cliente por WhatsApp.',
    placeholders: ['nombre_cliente', 'nombre_proyecto', 'valor', 'numero_sesiones'],
    example: DEFAULT_QUOTE_TEMPLATE,
  },
  {
    name: 'reminder_balance_template' as const,
    label: 'Recordatorio de saldo pendiente',
    where: 'Botón "Recordar por WhatsApp" en Finanzas → Pendientes por cobrar.',
    placeholders: ['nombre_cliente', 'saldo'],
    example: DEFAULT_BALANCE_TEMPLATE,
  },
  {
    name: 'reminder_session_template' as const,
    label: 'Recordatorio de sesión',
    where: 'Botón "Contactar cliente" en la tarjeta de próxima sesión, en Inicio.',
    placeholders: ['nombre_cliente', 'fecha', 'hora'],
    example: DEFAULT_SESSION_TEMPLATE,
  },
  {
    name: 'booking_confirmation_template' as const,
    label: 'Confirmación de cita agendada',
    where: 'Botón "Confirmar cita" al tocar una cita en el calendario, y el mensaje que se abre automático al crear una cita nueva (calendario, cotización o proyecto).',
    placeholders: ['nombre_cliente', 'fecha', 'hora', 'lugar', 'nombre_tatuador'],
    example: DEFAULT_BOOKING_CONFIRMATION_TEMPLATE,
  },
  {
    name: 'contact_client_template' as const,
    label: 'Contacto general de proyecto',
    where: 'Botón de WhatsApp en la ficha o el popup de un proyecto.',
    placeholders: ['nombre_cliente', 'nombre_proyecto'],
    example: DEFAULT_CONTACT_TEMPLATE,
  },
  {
    name: 'bot_contact_template' as const,
    label: 'Solicitud del bot',
    where: 'Lo que el cliente te envía por WhatsApp al terminar de completar el bot de solicitudes.',
    placeholders: ['nombre_estudio', 'nombre_cliente', 'genero', 'edad', 'zona', 'tamano', 'color', 'idea', 'cierre'],
    example: DEFAULT_BOT_CONTACT_TEMPLATE,
  },
  {
    name: 'quote_confirm_template' as const,
    label: 'Confirmar cotización desde la landing',
    where: '"Reservar mi proyecto" y "¿Tienes dudas?" en la landing pública que le compartes al cliente con su cotización.',
    placeholders: ['id_cotizacion'],
    example: DEFAULT_QUOTE_CONFIRM_TEMPLATE,
  },
]

export function MensajesForm({
  quoteMessageTemplate,
  reminderBalanceTemplate,
  reminderSessionTemplate,
  contactClientTemplate,
  botContactTemplate,
  quoteConfirmTemplate,
  bookingConfirmationTemplate,
}: {
  quoteMessageTemplate: string
  reminderBalanceTemplate: string
  reminderSessionTemplate: string
  contactClientTemplate: string
  botContactTemplate: string
  quoteConfirmTemplate: string
  bookingConfirmationTemplate: string
}) {
  const router = useRouter()
  const form = useForm<UpdateMessageTemplatesInput>({
    resolver: zodResolver(updateMessageTemplatesSchema) as Resolver<UpdateMessageTemplatesInput>,
    defaultValues: {
      quote_message_template: quoteMessageTemplate,
      reminder_balance_template: reminderBalanceTemplate,
      reminder_session_template: reminderSessionTemplate,
      contact_client_template: contactClientTemplate,
      bot_contact_template: botContactTemplate,
      quote_confirm_template: quoteConfirmTemplate,
      booking_confirmation_template: bookingConfirmationTemplate,
    },
  })

  async function onSubmit(values: UpdateMessageTemplatesInput) {
    const result = await updateMessageTemplates(values)
    if (!result.success) {
      toast.error(result.error.message)
      return
    }
    toast.success('Mensajes actualizados')
    form.reset(values)
    router.refresh()
  }

  return (
    <SettingsSubpage
      title="Plantillas de WhatsApp"
      description="Así se redactan los mensajes que salen desde OFINK hacia WhatsApp. Edítalos a tu manera — cada placeholder entre llaves se reemplaza solo con el dato real."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {TEMPLATES.map((tpl) => (
            <div key={tpl.name} className="rounded-2xl border border-white/8 bg-card p-4">
              <FormField
                control={form.control}
                name={tpl.name}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <FormLabel className="text-sm font-semibold text-white">{tpl.label}</FormLabel>
                        <p className="mt-0.5 text-xs text-muted-foreground">{tpl.where}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto shrink-0 px-2 py-1 text-xs text-primary hover:text-primary"
                        onClick={() => form.setValue(tpl.name, tpl.example, { shouldDirty: true })}
                      >
                        Usar ejemplo
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Placeholders disponibles:{' '}
                      {tpl.placeholders.map((p, i) => (
                        <span key={p}>
                          <code className="rounded bg-white/10 px-1 py-0.5 text-primary">{`{${p}}`}</code>
                          {i < tpl.placeholders.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                    <FormControl>
                      <Textarea rows={5} className="mt-2" placeholder={tpl.example} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
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
