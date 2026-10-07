'use server'

import { ok, err, type Result } from '@/lib/errors/types'

/**
 * Transcribe un audio corto (nota de voz de "Idea del tatuaje") con la API
 * de Deepgram. La clave vive SOLO en el servidor (DEEPGRAM_API_KEY, variable
 * de entorno en Vercel) — nunca se expone al navegador.
 */
export async function transcribeAudioAction(formData: FormData): Promise<Result<string>> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) {
    return err('VALIDATION_ERROR', 'Falta configurar DEEPGRAM_API_KEY en el servidor')
  }

  const file = formData.get('audio') as File | null
  if (!file) return err('VALIDATION_ERROR', 'No se recibió audio')
  if (file.size > 8 * 1024 * 1024) return err('VALIDATION_ERROR', 'El audio es muy largo')

  const buffer = await file.arrayBuffer()

  const res = await fetch(
    'https://api.deepgram.com/v1/listen?language=es&model=nova-2&smart_format=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': file.type || 'audio/webm',
      },
      body: buffer,
    }
  )

  if (!res.ok) {
    return err('DB_ERROR', `Deepgram respondió ${res.status}`)
  }

  const data = await res.json()
  const transcript: string | undefined =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript

  if (!transcript) return err('VALIDATION_ERROR', 'No se entendió el audio, intenta de nuevo')
  return ok(transcript)
}
