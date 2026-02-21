import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getOrCreateClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabase env vars not set')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getOrCreateClient() as any)[prop]
  },
})

export function getSupabase() {
  return getOrCreateClient()
}

export async function usuarioActivo(email: string): Promise<boolean> {
  try {
    const { data } = await (supabase
      .from('usuarios') as any)
      .select('activo')
      .eq('email', email)
      .single()
    return data?.activo === true
  } catch {
    return true
  }
}
