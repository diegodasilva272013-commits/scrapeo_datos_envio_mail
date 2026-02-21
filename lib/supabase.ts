import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

let _supabase: SupabaseClient | null = null

function getInstance(): SupabaseClient {
  if (!_supabase && supabaseUrl && supabaseKey) {
    _supabase = createClient(supabaseUrl, supabaseKey)
  }
  return _supabase!
}

export function getSupabase() {
  return getInstance()
}

// Proxy que retrasa la creación del cliente hasta el primer uso real
// Así no explota si las env vars aún no están seteadas al importar
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getInstance()
    if (!client) {
      throw new Error('Supabase no está configurado. Seteá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export async function usuarioActivo(email: string): Promise<boolean> {
  try {
    const { data } = await (getSupabase()
      .from('usuarios') as any)
      .select('activo')
      .eq('email', email)
      .single()
    return data?.activo === true
  } catch {
    return true // si Supabase no está configurado, permitir acceso
  }
}
