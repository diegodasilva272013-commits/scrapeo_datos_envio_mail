import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export async function usuarioActivo(email: string): Promise<boolean> {
  const { data } = await supabase
    .from('usuarios')
    .select('activo')
    .eq('email', email)
    .single()
  return data?.activo === true
}
