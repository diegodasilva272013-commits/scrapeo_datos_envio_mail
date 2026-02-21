import { NextRequest, NextResponse } from 'next/server'
import { supabaseWithToken } from '@/lib/supabaseServer'

function getToken(req: NextRequest) {
  return req.headers.get('x-sb-token') || ''
}

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req)
    if (!token) return NextResponse.json({ error: 'No autenticado', creds: {} })

    const sb = supabaseWithToken(token)
    const { data, error } = await sb
      .from('credenciales')
      .select('google_client_id,google_client_secret,google_sheet_id,openai_api_key,places_api_key')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message, creds: {} })
    return NextResponse.json({ creds: data || {} })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, creds: {} })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req)
    if (!token) return NextResponse.json({ error: 'No autenticado' })

    const body = await req.json()
    const { creds } = body as {
      creds: {
        google_client_id?: string
        google_client_secret?: string
        google_sheet_id?: string
        openai_api_key?: string
        places_api_key?: string
      }
    }

    const sb = supabaseWithToken(token)

    // Obtener user_id del JWT
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sesión inválida' })

    // Solo guardar campos con valor no vacío
    const toSave: Record<string, string> = { user_id: user.id }
    Object.entries(creds).forEach(([k, v]) => {
      if (v && typeof v === 'string' && v.trim()) toSave[k] = v.trim()
    })
    toSave['updated_at'] = new Date().toISOString()

    const { error } = await sb
      .from('credenciales')
      .upsert(toSave, { onConflict: 'user_id' })

    if (error) return NextResponse.json({ error: error.message })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
