import { BRAND, EXPERIENCE_INCLUDES, type QuoteTemplateData } from '@/lib/pdf/quote-template-data'
import { getStyleTheme } from '@/lib/pdf/style-theme'
import {
  OgIconZone,
  OgIconStyle,
  OgIconColor,
  OgIconSize,
  OgIconSessions,
  OgIconClock,
  OgIconGallery,
  OgIconShield,
  OgIconDescription,
  OgIconSkin,
  OgIconService,
  OgIconAvailability,
  OgIconCheck,
  OgIconWhatsapp,
  OgIconInstagram,
  OgIconTiktok,
  OgIconFacebook,
  OgIconWebsite,
} from '@/lib/pdf/og-icons'

/**
 * Única pieza que se genera para una cotización: una imagen premium que
 * reemplaza al PDF (eliminado — ver CHANGELOG). No es un documento, es una
 * presentación del proyecto: hero editorial, resumen económico unificado,
 * detalles con iconografía, galería de referencias, "tu experiencia
 * incluye" y un cierre emocional. Toda la data ya viene derivada de
 * `buildQuoteTemplateData()`; este componente solo pinta.
 *
 * Es UN SOLO sistema, no cinco plantillas: `getStyleTheme(d.style)` ajusta
 * un puñado de parámetros visuales (opacidad del watermark, fuerza del
 * degradado, tracking del nombre, aire entre secciones) según el estilo del
 * tatuaje — ver `style-theme.ts`.
 *
 * JSX para `next/og` (Satori): solo flexbox, todo nodo con hijos necesita
 * `display: 'flex'` explícito. Sin fuente condensada externa a propósito:
 * no descargar una fuente en el momento de generar el documento — el look
 * condensado se logra con peso 800/900 + letterSpacing negativo.
 */

const CARD = { backgroundColor: BRAND.card, borderRadius: 22, border: `1px solid ${BRAND.cardBorder}` } as const
function kicker(color: string) {
  return { fontSize: 15, fontWeight: 700, letterSpacing: 2, color, textTransform: 'uppercase' as const }
}
const LABEL = { fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: BRAND.gray, textTransform: 'uppercase' as const }

function CardHeader({ icon, text, color = BRAND.green }: { icon: React.ReactNode; text: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      {icon}
      <div style={{ display: 'flex', ...kicker(color), fontSize: 14 }}>{text}</div>
    </div>
  )
}

function Bullet({ text, color = BRAND.green }: { text: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 12 }}>
      <div style={{ display: 'flex', width: 7, height: 7, borderRadius: 4, backgroundColor: color, marginTop: 6 }} />
      <div style={{ display: 'flex', fontSize: 17, lineHeight: 1.4, color: BRAND.grayLight, flex: 1 }}>{text}</div>
    </div>
  )
}

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '50%' }}>
      {icon}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', ...LABEL }}>{label}</div>
        <div style={{ display: 'flex', fontSize: 19, color: BRAND.white, marginTop: 4 }}>{value}</div>
      </div>
    </div>
  )
}

export function QuoteOgImage({
  data,
  qrDataUrl,
  platformMarkUrl,
}: {
  data: QuoteTemplateData
  qrDataUrl?: string | null
  platformMarkUrl?: string | null
}) {
  const d = data
  const theme = getStyleTheme(d.style)
  const accent = d.templateColor

  const detailFields: Array<[React.ReactNode, string, string | null]> = [
    [<OgIconZone color={accent} key="zone" />, 'Zona del cuerpo', d.bodyZone],
    [<OgIconStyle color={accent} key="style" />, 'Estilo', d.style],
    [<OgIconSize color={accent} key="size" />, 'Tamaño aprox.', d.size],
    [<OgIconColor color={accent} key="color" />, 'Color', d.color],
    [<OgIconSkin color={accent} key="skin" />, 'Tono de piel', d.skinTone],
    [<OgIconService color={accent} key="service" />, 'Servicio', d.service],
    [<OgIconAvailability color={accent} key="avail" />, 'Disponibilidad', d.availability],
  ]
  const visibleDetails = detailFields.filter(([, , v]) => v) as Array<[React.ReactNode, string, string]>

  const bullets = [
    d.paymentPolicy && `Abono: ${d.paymentPolicy}`,
    d.cancellationPolicy && `Cancelaciones: ${d.cancellationPolicy}`,
    ...d.rules,
  ].filter(Boolean) as string[]

  const contactLines: Array<[React.ReactNode, string]> = [
    d.whatsapp && [<OgIconWhatsapp color={accent} key="wa" />, `WhatsApp: ${d.whatsapp}`],
    d.instagram && [<OgIconInstagram color={accent} key="ig" />, `Instagram: @${d.instagram}`],
    d.tiktok && [<OgIconTiktok color={accent} key="tt" />, `TikTok: ${d.tiktok}`],
    d.facebook && [<OgIconFacebook color={accent} key="fb" />, `Facebook: ${d.facebook}`],
    d.website && [<OgIconWebsite color={accent} key="web" />, `Web: ${d.website}`],
  ].filter(Boolean) as Array<[React.ReactNode, string]>

  const gap = theme.sectionGap

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BRAND.bg,
        fontFamily: 'Helvetica, Arial, sans-serif',
        padding: 48,
      }}
    >
      {/* ---------- ENCABEZADO ---------- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {d.studioLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.studioLogoUrl} alt="" width={44} height={44} style={{ display: 'flex', borderRadius: 22 }} />
          )}
          <div style={{ display: 'flex', fontSize: 20, fontWeight: 800, color: BRAND.white, letterSpacing: 1 }}>
            {d.studioName.toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, letterSpacing: 2, color: accent }}>
            COTIZACIÓN
          </div>
          <div style={{ display: 'flex', fontSize: 15, fontWeight: 700, color: BRAND.grayLight, marginTop: 4 }}>
            #{d.code}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 10,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: BRAND.bg,
              backgroundColor: accent,
              borderRadius: 6,
              padding: '6px 12px',
            }}
          >
            {d.statusLabel.toUpperCase()}
          </div>
        </div>
      </div>

      {/* ---------- HERO: portada del proyecto ---------- */}
      <div style={{ position: 'relative', display: 'flex', marginTop: 28, height: 560, borderRadius: 26, overflow: 'hidden' }}>
        {d.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={d.photoUrl}
            alt=""
            width={984}
            height={560}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background: d.photoUrl
              ? `linear-gradient(180deg, rgba(9,9,9,${theme.heroOverlayStrength * 0.35}) 0%, rgba(9,9,9,${theme.heroOverlayStrength}) 62%, ${BRAND.bg} 100%)`
              : `linear-gradient(160deg, #161616 0%, ${BRAND.bg} 100%)`,
          }}
        />
        {d.style && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 132,
                fontWeight: 800,
                color: BRAND.white,
                opacity: theme.watermarkOpacity,
                letterSpacing: -3,
                whiteSpace: 'nowrap',
              }}
            >
              {d.style.toUpperCase()}
            </div>
          </div>
        )}
        <div style={{ position: 'absolute', left: 40, right: 40, bottom: 40, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 104,
              fontWeight: 800,
              color: BRAND.white,
              letterSpacing: theme.nameLetterSpacing,
              lineHeight: 0.95,
            }}
          >
            {d.clientName.toUpperCase()}
          </div>
          <div style={{ display: 'flex', width: 70, height: 5, backgroundColor: accent, marginTop: 16, marginBottom: 12 }} />
          <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, letterSpacing: 2, color: accent }}>PROYECTO</div>
          <div style={{ display: 'flex', fontSize: 21, color: BRAND.white, marginTop: 2 }}>{d.service || 'Tatuaje'}</div>
        </div>
      </div>

      {/* ---------- RESUMEN ECONÓMICO (bloque único) ---------- */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: gap, padding: 34, ...CARD }}>
        <div style={{ display: 'flex', ...kicker(accent) }}>Valor total</div>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: BRAND.white, marginTop: 6, letterSpacing: -1 }}>
          {d.isCourtesy ? 'Cortesía' : `$${d.price.toLocaleString('es-CO')}`}
        </div>
        <div style={{ display: 'flex', height: 1, backgroundColor: BRAND.cardBorder, marginTop: 26, marginBottom: 22 }} />
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {!d.isCourtesy && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', ...LABEL }}>Abono ({d.depositPercentage}%)</div>
                <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: BRAND.white, marginTop: 6 }}>
                  ${d.depositAmount.toLocaleString('es-CO')}
                </div>
              </div>
              <div style={{ display: 'flex', width: 1, height: 44, backgroundColor: BRAND.cardBorder, margin: '0 32px' }} />
            </>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', ...LABEL }}>Sesiones</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <OgIconSessions size={20} color={accent} />
              <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: BRAND.white }}>{d.sessionCount}</div>
            </div>
          </div>
          {d.avgSessionDuration && (
            <>
              <div style={{ display: 'flex', width: 1, height: 44, backgroundColor: BRAND.cardBorder, margin: '0 32px' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', ...LABEL }}>Tiempo estimado</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <OgIconClock size={20} color={accent} />
                  <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: BRAND.white }}>{d.avgSessionDuration}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ---------- DESCRIPCIÓN ---------- */}
      {d.description && (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: gap, padding: 32, ...CARD }}>
          <CardHeader icon={<OgIconDescription size={18} color={accent} />} text="Descripción del proyecto" color={accent} />
          <div style={{ display: 'flex', fontSize: 20, lineHeight: 1.55, color: BRAND.grayLight }}>{d.description}</div>
        </div>
      )}

      {/* ---------- DETALLES ---------- */}
      {visibleDetails.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 26, marginTop: gap, padding: 32, ...CARD }}>
          {visibleDetails.map(([icon, label, value]) => (
            <DetailField key={label} icon={icon} label={label} value={value} />
          ))}
        </div>
      )}

      {/* ---------- TU EXPERIENCIA INCLUYE ---------- */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: gap, padding: 32, ...CARD }}>
        <div style={{ display: 'flex', ...kicker(accent), marginBottom: 18 }}>Tu experiencia incluye</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 16 }}>
          {EXPERIENCE_INCLUDES.map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '50%' }}>
              <OgIconCheck color={accent} />
              <div style={{ display: 'flex', fontSize: 18, color: BRAND.white }}>{item}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- POLÍTICAS + REFERENCIAS ---------- */}
      {(bullets.length > 0 || d.referencePhotos.length > 0) && (
        <div style={{ display: 'flex', gap: 16, marginTop: gap }}>
          {bullets.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1.3, padding: 30, ...CARD }}>
              <CardHeader icon={<OgIconShield size={18} color={accent} />} text="Políticas del estudio" color={accent} />
              {bullets.map((b, i) => (
                <Bullet key={i} text={b} color={accent} />
              ))}
            </div>
          )}
          {d.referencePhotos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 30, ...CARD }}>
              <CardHeader icon={<OgIconGallery size={18} color={accent} />} text="Referencias" color={accent} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {d.referencePhotos.slice(0, 4).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" width={92} height={92} style={{ display: 'flex', borderRadius: 14 }} />
                ))}
                {d.referencePhotos.length > 4 && (
                  <div
                    style={{
                      display: 'flex',
                      width: 92,
                      height: 92,
                      borderRadius: 14,
                      backgroundColor: '#1e1e1e',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', fontSize: 19, fontWeight: 700, color: BRAND.white }}>
                      +{d.referencePhotos.length - 4}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- CIERRE EMOCIONAL ---------- */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: gap + 8,
          paddingTop: 28,
          borderTop: `1px solid ${BRAND.cardBorder}`,
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, color: accent, fontWeight: 700, lineHeight: 1.3 }}>
          Cada tatuaje comienza con una historia.
        </div>
        <div style={{ display: 'flex', fontSize: 22, color: accent, fontWeight: 700, lineHeight: 1.3, marginTop: 2 }}>
          Gracias por permitirme convertir la tuya en arte.
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26 }}>
          {contactLines.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {contactLines.map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {icon}
                  <div style={{ display: 'flex', fontSize: 14, color: BRAND.grayLight }}>{text}</div>
                </div>
              ))}
            </div>
          )}
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="" width={84} height={84} style={{ display: 'flex', borderRadius: 8 }} />
          ) : (
            platformMarkUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={platformMarkUrl} alt="" width={30} height={30} style={{ display: 'flex' }} />
                <div style={{ display: 'flex', fontSize: 15, fontWeight: 700, color: BRAND.white, letterSpacing: 1 }}>OFINK</div>
              </div>
            )
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 }}>
        <div style={{ display: 'flex', fontSize: 12, color: BRAND.grayDark }}>Este presupuesto es válido por 7 días.</div>
        <div style={{ display: 'flex', fontSize: 13, fontWeight: 700, color: accent }}>Fecha: {d.dateLabel}</div>
      </div>
    </div>
  )
}
