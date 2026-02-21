'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push('/dashboard')
    } else {
      setError(data.error || 'Error al iniciar sesión')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-sm p-8 card">
        <h1 className="font-display text-2xl font-bold text-text mb-6">Iniciar sesión</h1>

        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input className="input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && login()} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={login} disabled={loading} className="btn-primary py-3">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
