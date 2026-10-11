import { NextResponse } from 'next/server'

// Build SHA del deploy que está sirviendo ahora mismo. La PWA lo compara con
// el SHA con el que se compiló su propio bundle (`register-sw.tsx`): si
// difieren, hay un deploy nuevo y se actualiza sola.
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    { sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? 'local' },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
