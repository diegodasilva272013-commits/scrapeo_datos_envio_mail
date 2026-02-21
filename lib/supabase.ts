import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function usuarioActivo(email: string): Promise<boolean> {
  try {
    const { data } = await supabase.from('usuarios').select('activo').eq('email', email).single()
    return data?.activo === true
  } catch { return true }
}
