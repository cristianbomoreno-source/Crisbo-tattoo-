import { renderToBuffer } from '@react-pdf/renderer'
import { NextResponse } from 'next/server'
import { getConsentLinkForPdf } from '@/queries/consent-links'
import { getCurrentStudio } from '@/queries/studio'
import { ConsentPdf } from '@/lib/pdf/consent-pdf'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getConsentLinkForPdf(id)
  if (!result.success) return new NextResponse('No encontrado', { status: 404 })

  const c = result.data

  // Defensa en profundidad: las RLS de `consent_links` ya filtran por estudio,
  // pero `/api/**` queda fuera del matcher de `proxy.ts`. Un consentimiento
  // firmado lleva datos de salud del cliente — no debe depender de una sola capa.
  const studio = await getCurrentStudio()
  if (!studio || c.studioId !== studio.id) {
    return new NextResponse('No encontrado', { status: 404 })
  }

  // Solo los firmados tienen PDF (un borrador no se imprime, §2b).
  if (c.status !== 'signed') return new NextResponse('El consentimiento no está firmado', { status: 404 })

  const buffer = await renderToBuffer(
    <ConsentPdf
      studioName={c.studioName}
      clientName={c.clientName}
      projectName={c.projectName}
      templateName={c.templateName}
      templateContent={c.templateContent}
      formData={c.formData}
      signatureData={c.signatureData}
      signedAt={c.signedAt}
      signerIp={c.signerIp}
    />
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      // 'inline' para que "Ver documento" lo abra directo en el navegador;
      // el usuario igual puede guardarlo desde ahí si quiere.
      'Content-Disposition': `inline; filename="consentimiento-${id}.pdf"`,
    },
  })
}
