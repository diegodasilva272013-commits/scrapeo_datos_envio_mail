import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || ''
  )
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 })
  }

  // Verificar que el usuario está activo
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('activo')
    .eq('email', email)
    .single()

  if (!usuario?.activo) {
    return NextResponse.json({ error: 'Tu cuenta no está activa. Contactá a Areté.' }, { status: 403 })
  }

  // Guardar token en cookie
  const cookieStore = cookies()
  cookieStore.set('sb-token', data.session.access_token, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return NextResponse.json({ ok: true })
}
