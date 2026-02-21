import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { access_token, email } = await req.json()

  if (!access_token || !email) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const cookieStore = cookies()

  // Token httpOnly (para verificación server-side)
  cookieStore.set('sb-token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })

  // Email legible por el cliente (para useAuth hook)
  cookieStore.set('sb-user-email', email, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })

  return NextResponse.json({ ok: true })
}
