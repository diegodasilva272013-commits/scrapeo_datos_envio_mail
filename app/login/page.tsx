'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import { AreteLogo } from '@/components/AreteLogo'

export default function LoginPage() {
  const { data: session } = useSession()
  const router = useRouter()
  useEffect(() => { if (session) router.push('/dashboard') }, [session, router])

  return (
    <div className="min-h-screen bg-bg flex relative overflow-hidden">

      {/* ── Panel izquierdo: branding ── */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-16 relative">
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(61,114,224,0.08) 0%,transparent 65%)' }} />

        <div className="relative z-10 flex flex-col items-center gap-6 animate-slide-up">
          {/* Logo GRANDE — vectorial, colores sólidos, cero pixelado */}
          <AreteLogo size={160} variant="full" theme="dark" />

          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
            <span className="font-mono text-[10px] text-accent tracking-[0.3em] uppercase">LeadFlow</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
          </div>

          <p className="text-text-dim font-body text-sm text-center max-w-xs leading-relaxed">
            Prospección B2B automatizada con IA. Scrapeo de Google Maps, emails personalizados y envío por Gmail.
          </p>

          <div className="grid grid-cols-3 gap-3 w-full max-w-xs mt-2">
            {[{ n: 'GPT-4.1', d: 'Motor IA' }, { n: '0 DB', d: 'Sin base de datos' }, { n: '100%', d: 'Automatizado' }].map(({ n, d }) => (
              <div key={d} className="text-center bg-surface border border-border rounded-xl px-3 py-3">
                <div className="font-display text-sm font-bold text-accent">{n}</div>
                <div className="font-mono text-[9px] text-muted mt-0.5 leading-tight">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-px bg-border" />

      {/* ── Panel derecho ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>

          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <AreteLogo size={100} variant="full" theme="dark" />
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-text">Iniciar sesión</h2>
            <p className="text-text-dim font-body text-sm mt-1">Conectá tu cuenta de Google para empezar</p>
          </div>

          <div className="card flex flex-col gap-5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(61,114,224,0.6),transparent)' }} />
            <div className="flex flex-col gap-2">
              <p className="text-text-dim text-xs font-mono uppercase tracking-wider mb-1">Permisos requeridos</p>
              {[{ icon: '📊', t: 'Google Sheets — leer y escribir leads' }, { icon: '✉️', t: 'Gmail — enviar emails' }, { icon: '📁', t: 'Google Drive — elegir spreadsheet' }].map(({ icon, t }) => (
                <div key={t} className="flex items-center gap-2.5 text-text-dim text-xs font-body bg-surface-2 rounded-lg px-3 py-2.5">
                  <span>{icon}</span><span>{t}</span>
                </div>
              ))}
            </div>
            <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-display font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-black/20">
              <GoogleIcon /> Continuar con Google
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-surface px-3 text-muted text-xs font-mono">o</span></div>
            </div>

            <button onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center gap-2 bg-accent/10 text-accent border border-accent/30 font-display font-semibold py-3.5 px-6 rounded-xl hover:bg-accent/20 active:scale-[0.98] transition-all duration-150">
              🚀 Ingresar Ahora (modo test)
            </button>
          </div>

          <div className="text-center mt-6">
            <p className="text-muted text-xs font-body">¿Primera vez? Configurá las credenciales primero</p>
            <a href="/setup" className="text-accent text-xs font-mono hover:underline mt-1 inline-block">Ir a Setup de API Keys →</a>
          </div>
          <p className="text-center text-muted text-xs font-body mt-5">Tus datos viven en tu Google Drive. Sin base de datos.</p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
