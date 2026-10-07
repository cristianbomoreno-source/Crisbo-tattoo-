'use client'

import { useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
}

export function SignaturePad({ onSave }: SignaturePadProps) {
  const sigRef = useRef<SignatureCanvas>(null)

  function handleClear() {
    sigRef.current?.clear()
  }

  function handleSave() {
    if (sigRef.current?.isEmpty()) return
    const dataUrl = sigRef.current?.toDataURL('image/png') ?? ''
    onSave(dataUrl)
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{ width: 500, height: 200, className: 'w-full' }}
        />
      </div>
      <p className="text-xs text-muted-foreground">Firma con el mouse o el dedo dentro del recuadro.</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleClear}>
          Limpiar
        </Button>
        <Button type="button" onClick={handleSave}>
          Guardar firma
        </Button>
      </div>
    </div>
  )
}
