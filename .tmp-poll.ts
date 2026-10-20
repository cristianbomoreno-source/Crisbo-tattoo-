import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { sendBodyTemplate } from '@/lib/whatsapp-cloud/api'
const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const { data: acc } = await db.from('whatsapp_accounts').select('phone_number_id, waba_id, access_token').eq('studio_id', '809b00a6-5040-43a8-a735-ab306fe5c163').single()
for (let i = 0; i < 45; i++) {
  const r = await fetch(`https://graph.facebook.com/v21.0/${acc!.waba_id}/message_templates?name=resena_google_v2&fields=status,rejected_reason`, { headers: { Authorization: `Bearer ${acc!.access_token}` } })
  const t = (await r.json()).data?.[0]
  if (t && t.status !== 'PENDING') {
    console.log(new Date().toISOString(), JSON.stringify(t))
    if (t.status === 'APPROVED') console.log('prueba', await sendBodyTemplate(acc!, '573001275041', { name: 'resena_google_v2', language: 'es', params: ['Cristian'] }))
    process.exit(0)
  }
  await new Promise((res) => setTimeout(res, 120_000))
}
console.log('sigue PENDING tras 90 min')
