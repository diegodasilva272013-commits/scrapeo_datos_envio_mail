import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseKey)
  }
  return _supabase
}

// Alias directo para usar como: import { supabase } from '@/lib/supabase'
export const supabase = (typeof window !== 'undefined' || supabaseUrl)
  ? createClient(supabaseUrl, supabaseKey)
  : null as any

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
