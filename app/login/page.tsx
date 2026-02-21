'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { supabase } from '@/lib/supabase'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loginEmail = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      document.cookie = `sb-user-email=${encodeURIComponent(email)};path=/;max-age=${60 * 60 * 24 * 7};samesite=lax`
      router.push('/dashboard')
    } else {
      setError(data.error || 'Email o contraseña incorrectos')
    }
    setLoading(false)
  }

  const loginGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-sm p-8 card">
        <h1 className="font-display text-2xl font-bold text-text mb-6">Iniciar sesión</h1>

        {errorParam === 'not_authorized' && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/30 text-red-400 text-sm border border-red-800">
            ⛔ Esa cuenta no tiene acceso. Contactá a Areté.
          </div>
        )}

        <div className="flex flex-col gap-4">

          {/* Email y contraseña */}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input className="input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && loginEmail()} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={loginEmail} disabled={loading} className="btn-primary py-3">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {/* Separador */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted text-xs">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google */}
          <button
            onClick={loginGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 transition-all shadow"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
