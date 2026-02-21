import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^=+/, '') || 'placeholder'

/** Crea un cliente Supabase autenticado con el JWT del usuario */
export function supabaseWithToken(token: string) {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
}

export interface Credenciales {
  google_client_id?: string
  google_client_secret?: string
  google_sheet_id?: string
  openai_api_key?: string
  places_api_key?: string
  google_sheet_token?: Record<string, string>
}

/** Lee las credenciales del usuario desde la tabla credenciales */
export async function getCredenciales(sbToken: string): Promise<Credenciales | null> {
  const sb = supabaseWithToken(sbToken)
  const { data, error } = await sb
    .from('credenciales')
    .select('google_client_id,google_client_secret,google_sheet_id,openai_api_key,places_api_key,google_sheet_token')
    .single()
  if (error || !data) return null
  return data as Credenciales
}
