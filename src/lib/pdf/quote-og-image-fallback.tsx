import { BRAND, type QuoteTemplateData } from '@/lib/pdf/quote-template-data'

/**
 * Respaldo de `QuoteOgImage`: si la plantilla completa falla al renderizar
 * (imagen remota rota, algo que Satori no soporta), esto es lo que se envía
 * en su lugar — para que "no me sale imagen" nunca vuelva a pasar. A
 * propósito extremadamente simple: nada de fotos, íconos SVG, degradados
 * ni texto en mayúsculas vía CSS — solo texto plano sobre fondo sólido,
 * lo más difícil de romper posible.
 */
export function QuoteOgImageFallback({ data }: { data: QuoteTemplateData }) {
  const d = data
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: BRAND.bg,
        fontFamily: 'Helvetica, Arial, sans-serif',
        padding: 64,
      }}
    >
      <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, color: d.templateColor }}>
        {d.studioName}
      </div>
      <div style={{ display: 'flex', fontSize: 72, fontWeight: 700, color: BRAND.white, marginTop: 24 }}>
        {d.clientName}
      </div>
      <div style={{ display: 'flex', fontSize: 24, color: BRAND.grayLight, marginTop: 12 }}>
        {d.projectLabel}
      </div>
      <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, color: BRAND.white, marginTop: 48 }}>
        {d.isCourtesy ? 'Cortesia' : `$${d.price.toLocaleString('es-CO')}`}
      </div>
      {!d.isCourtesy && (
        <div style={{ display: 'flex', fontSize: 20, color: BRAND.grayLight, marginTop: 12 }}>
          Abono {d.depositPercentage}%: ${d.depositAmount.toLocaleString('es-CO')}
        </div>
      )}
      <div style={{ display: 'flex', fontSize: 18, color: BRAND.grayLight, marginTop: 12 }}>
        {d.sessionCount} sesion{d.sessionCount === 1 ? '' : 'es'}
      </div>
      {d.whatsapp && (
        <div style={{ display: 'flex', fontSize: 16, color: BRAND.grayLight, marginTop: 40 }}>
          WhatsApp: {d.whatsapp}
        </div>
      )}
    </div>
  )
}
