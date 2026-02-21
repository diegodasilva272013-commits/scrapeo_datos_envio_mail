import { createClient } from '@supabase/supabase-js'

let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    )
  }
  return _supabase
}

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
