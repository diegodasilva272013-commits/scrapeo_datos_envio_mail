import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^=+/, '')

export const supabase = createClient(url, key)

export async function usuarioActivo(email: string): Promise<boolean> {
  try {
    const { data } = await supabase.from('usuarios').select('activo').eq('email', email).single()
    return data?.activo === true
  } catch { return true }
}
