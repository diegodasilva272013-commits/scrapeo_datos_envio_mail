import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function getSupabase() {
  return supabase
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
