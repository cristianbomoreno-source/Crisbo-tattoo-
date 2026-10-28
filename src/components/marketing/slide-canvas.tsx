/* eslint-disable @next/next/no-img-element */
import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import type { Slide } from '@/lib/marketing/types'
import { isStorySlide } from '@/lib/marketing/types'
import { anton } from './fonts'

/**
 * Lámina de carrusel (1080×1350) o historia (1080×1920) con el estilo de
 * los carruseles de @crisbotattoo: negro, foto de tatuaje en blanco y negro
 * que se funde, títulos en letra condensada (Anton) blanca y dorada, el
 * logo CB y el pie con @crisbotattoo. Se dibuja a tamaño real; la vista
 * previa la escala con `scale`. La misma pieza se exporta a PNG.
 */

export const GOLD = '#d9a54a'
const INK = '#f4f1ea'
const GREY = '#a9a39b'
const DIM = '#7d776f'

/** "Hola *mundo*\nchao" → texto con lo marcado en dorado y saltos de línea. */
function rich(text: string, gold = GOLD): ReactNode {
  return text.split('\n').map((line, li, arr) => (
    <span key={li}>
      {line.split('*').map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{ color: gold }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
      {li < arr.length - 1 && <br />}
    </span>
  ))
}

const display = (size: number): CSSProperties => ({
  fontFamily: `${anton.style.fontFamily}, Impact, sans-serif`,
  fontSize: size,
  lineHeight: 0.95,
  textTransform: 'uppercase',
  letterSpacing: '0.005em',
  color: INK,
  margin: 0,
})
const bodyText = (size: number, color = GREY): CSSProperties => ({
  fontFamily: 'var(--font-sans), Inter, system-ui, sans-serif',
  fontSize: size,
  lineHeight: 1.35,
  color,
  margin: 0,
  whiteSpace: 'pre-line',
})

function Photo({ src, fade }: { src?: string; fade: 'bottom' | 'full' | 'top' }) {
  if (!src) return null
  const overlay =
    fade === 'full'
      ? 'linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.35) 35%, rgba(0,0,0,.85) 70%, #000 100%)'
      : fade === 'top'
        ? 'linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.35) 35%, #000 58%)'
        : 'linear-gradient(180deg, rgba(0,0,0,.2) 0%, rgba(0,0,0,.25) 30%, rgba(0,0,0,.85) 60%, #000 78%)'
  return (
    <>
      <img
        src={src}
        alt=""
        crossOrigin="anonymous"
        style={{ position: 'absolute', inset: 0, width: '100%', height: fade === 'top' ? '62%' : '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.08)' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: overlay }} />
    </>
  )
}

function Logo({ top = 80 }: { top?: number }) {
  return <img src="/brand/cb-isotipo-mark.png" alt="" style={{ position: 'absolute', top, left: 88, height: 64, width: 'auto' }} />
}

function Footer({ right, story }: { right: string; story?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 88,
        right: 88,
        bottom: story ? 240 : 66,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...bodyText(34, DIM),
      }}
    >
      <span>@crisbotattoo</span>
      <span style={{ color: right === 'Desliza →' ? '#cfc8bf' : DIM }}>{right}</span>
    </div>
  )
}

function KwPill({ kw, size = 150 }: { kw: string; size?: number }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
      <span style={{ background: GOLD, borderRadius: 34, padding: `${size * 0.22}px ${size * 0.38}px`, ...display(size), color: '#0b0a09' }}>{kw}</span>
      <span style={bodyText(34, GREY)}>Enviar por mensaje directo</span>
    </div>
  )
}

type Props = { slide: Slide; photo?: string; isLast?: boolean }

export const SlideCanvas = forwardRef<HTMLDivElement, Props>(function SlideCanvas({ slide, photo, isLast }, ref) {
  const story = isStorySlide(slide)
  const W = 1080
  const H = story ? 1920 : 1350
  const base: CSSProperties = { position: 'relative', width: W, height: H, background: '#000', overflow: 'hidden' }
  const pad = 88
  const swipe = isLast ? 'Colina Campestre, Bogotá' : 'Desliza →'

  const content = (() => {
    switch (slide.tpl) {
      case 'cover':
        return (
          <>
            <Photo src={photo} fade="bottom" />
            <Logo />
            <div style={{ position: 'absolute', left: pad, right: pad, bottom: 190, display: 'flex', flexDirection: 'column', gap: 34 }}>
              <h1 style={display(slide.title.length > 34 ? 128 : 156)}>{rich(slide.title)}</h1>
              {slide.subtitle && <p style={bodyText(50, '#d6cfc6')}>{rich(slide.subtitle, '#ffffff')}</p>}
            </div>
            <Footer right={swipe} />
          </>
        )
      case 'point':
        return (
          <>
            <Photo src={photo} fade="top" />
            <Logo />
            <div style={{ position: 'absolute', left: pad, right: pad, top: 410, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {slide.number && <span style={{ ...display(slide.number.length > 3 ? 150 : 230), color: GOLD }}>{slide.number}</span>}
              <h2 style={display(116)}>{rich(slide.title)}</h2>
              {slide.body && <p style={bodyText(48)}>{slide.body}</p>}
              {(slide.label || slide.highlight) && (
                <>
                  <div style={{ height: 2, background: GOLD, opacity: 0.7, margin: '22px 0 8px' }} />
                  <p style={bodyText(48, INK)}>
                    {slide.label && <span style={{ ...display(52), color: GOLD, marginRight: 16 }}>{slide.label}</span>}
                    {slide.highlight && rich(slide.highlight)}
                  </p>
                </>
              )}
            </div>
            <Footer right={swipe} />
          </>
        )
      case 'text':
        return (
          <>
            <Logo />
            <div style={{ position: 'absolute', left: pad, right: pad, top: 260, display: 'flex', flexDirection: 'column', gap: 48 }}>
              <h2 style={display(128)}>{rich(slide.title)}</h2>
              <div style={{ height: 2, background: GOLD, opacity: 0.7, width: 220 }} />
              {slide.body && <p style={bodyText(54, '#d6cfc6')}>{slide.body}</p>}
            </div>
            <Footer right={swipe} />
          </>
        )
      case 'review':
        return (
          <>
            <Logo />
            <div style={{ position: 'absolute', left: pad, right: pad, top: 300, display: 'flex', flexDirection: 'column', gap: 44 }}>
              <span style={{ fontSize: 96, color: GOLD, letterSpacing: 8, lineHeight: 1 }}>★★★★★</span>
              <p style={{ ...bodyText(66, INK), lineHeight: 1.3 }}>“{slide.body}”</p>
              {slide.author && <p style={bodyText(42, GREY)}>— {slide.author}</p>}
              <span style={{ alignSelf: 'flex-start', border: `2px solid ${GOLD}`, borderRadius: 999, padding: '14px 30px', ...bodyText(36, GOLD) }}>
                5,0 ★ en Google
              </span>
            </div>
            <Footer right={swipe} />
          </>
        )
      case 'cta':
        return (
          <>
            <Photo src={photo} fade="full" />
            <Logo />
            <div style={{ position: 'absolute', left: pad, right: pad, top: 230, display: 'flex', flexDirection: 'column', gap: 40 }}>
              <h2 style={display(150)}>{rich(slide.title)}</h2>
              {slide.subtitle && <p style={bodyText(54, '#d6cfc6')}>{slide.subtitle}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, ...bodyText(40, '#d6cfc6') }}>
                <span style={{ width: 66, height: 66, borderRadius: 999, background: '#111', border: '1px solid #333', display: 'grid', placeItems: 'center' }}>
                  <img src="/brand/cb-isotipo-mark.png" alt="" style={{ height: 34, width: 'auto' }} />
                </span>
                <span>
                  Escríbele a <b style={{ color: '#fff' }}>@crisbotattoo</b>
                </span>
              </div>
            </div>
            {slide.kw && (
              <div style={{ position: 'absolute', right: pad, bottom: 300 }}>
                <KwPill kw={slide.kw} />
              </div>
            )}
            {slide.body && <p style={{ position: 'absolute', left: pad, bottom: 200, ...bodyText(40, GREY) }}>{slide.body}</p>}
            <Footer right="Colina Campestre, Bogotá" />
          </>
        )
      case 'story':
        return (
          <>
            <Photo src={photo} fade="bottom" />
            <Logo top={200} />
            <div style={{ position: 'absolute', left: pad, right: pad, bottom: 420, display: 'flex', flexDirection: 'column', gap: 40 }}>
              <h1 style={display(170)}>{rich(slide.title)}</h1>
              {slide.body && <p style={bodyText(56, '#d6cfc6')}>{slide.body}</p>}
            </div>
            <Footer right="Colina Campestre, Bogotá" story />
          </>
        )
      case 'story-countdown':
        return (
          <>
            <Photo src={photo} fade="full" />
            <Logo top={200} />
            <div style={{ position: 'absolute', left: pad, right: pad, top: 520, display: 'flex', flexDirection: 'column', gap: 34 }}>
              <span style={{ ...display(slide.number && slide.number.length > 3 ? 260 : 420), color: GOLD }}>{slide.number}</span>
              <h1 style={display(140)}>{rich(slide.title)}</h1>
              {slide.body && <p style={bodyText(56, '#d6cfc6')}>{slide.body}</p>}
            </div>
            <Footer right="Colina Campestre, Bogotá" story />
          </>
        )
      case 'story-poll':
        return (
          <>
            <Photo src={photo} fade="full" />
            <Logo top={200} />
            <div style={{ position: 'absolute', left: pad, right: pad, top: 560, display: 'flex', flexDirection: 'column', gap: 60 }}>
              <h1 style={display(150)}>{rich(slide.title)}</h1>
              <div style={{ background: '#fff', borderRadius: 40, padding: 30, display: 'grid', gap: 22, boxShadow: '0 30px 80px rgba(0,0,0,.5)' }}>
                {(slide.options ?? ['Sí', 'No']).map((o) => (
                  <div key={o} style={{ borderRadius: 26, background: '#f1f1f1', padding: '34px 30px', textAlign: 'center', ...bodyText(52, '#111'), fontWeight: 700 }}>
                    {o}
                  </div>
                ))}
              </div>
            </div>
            <Footer right="Colina Campestre, Bogotá" story />
          </>
        )
      case 'story-cta':
        return (
          <>
            <Photo src={photo} fade="full" />
            <Logo top={200} />
            <div style={{ position: 'absolute', left: pad, right: pad, top: 560, display: 'flex', flexDirection: 'column', gap: 50 }}>
              <h1 style={display(160)}>{rich(slide.title)}</h1>
              {slide.body && <p style={bodyText(56, '#d6cfc6')}>{slide.body}</p>}
            </div>
            {slide.kw && (
              <div style={{ position: 'absolute', right: pad, bottom: 520 }}>
                <KwPill kw={slide.kw} size={170} />
              </div>
            )}
            <Footer right="Colina Campestre, Bogotá" story />
          </>
        )
    }
  })()

  return (
    <div ref={ref} style={base}>
      {content}
    </div>
  )
})

/** Vista previa escalada de una lámina. */
export function SlidePreview({ slide, photo, isLast, width }: Props & { width: number }) {
  const story = isStorySlide(slide)
  const scale = width / 1080
  const height = (story ? 1920 : 1350) * scale
  return (
    <div style={{ width, height, overflow: 'hidden', borderRadius: 14, flexShrink: 0 }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <SlideCanvas slide={slide} photo={photo} isLast={isLast} />
      </div>
    </div>
  )
}
