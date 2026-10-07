'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FolderPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { convertQuoteToProjectAction } from '@/actions/quotes'

export function ConvertQuoteButton({
  quoteId,
  className,
  label = 'Convertir en proyecto',
  onConverted,
}: {
  quoteId: string
  className?: string
  label?: string
  onConverted?: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function convert() {
    setLoading(true)
    const result = await convertQuoteToProjectAction(quoteId)
    if (!result.success) {
      setLoading(false)
      toast.error(result.error.message)
      return
    }
    toast.success('Proyecto creado desde la cotización')
    onConverted?.()
    router.push(`/dashboard/projects/${result.data.projectId}`)
  }

  return (
    <Button type="button" size="sm" onClick={convert} disabled={loading} className={className}>
      <FolderPlus className="size-4" />
      {loading ? 'Convirtiendo…' : label}
    </Button>
  )
}
