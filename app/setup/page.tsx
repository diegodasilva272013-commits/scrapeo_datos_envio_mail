'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

interface Creds {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  OPENAI_API_KEY: string
  GOOGLE_PLACES_API_KEY: string
  ALLOWED_EMAIL: string
  GOOGLE_SHEET_ID: string
}

const EMPTY: Creds = {
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  OPENAI_API_KEY: '',
  GOOGLE_PLACES_API_KEY: '',
  ALLOWED_EMAIL: '',
  GOOGLE_SHEET_ID: '',
}

export default function SetupPage() {
  const router = useRouter()
  const [creds, setCreds] = useState<Creds>(EMPTY)
  const [status, setStatus] = useState<Record<string, boolean>>({})
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<Record<string, boolean>>({})
  const [verifyResult, setVerifyResult] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [driveStatus, setDriveStatus] = useState<{ ok: boolean; msg: string; count?: number } | null>(null)
  const [driveTesting, setDriveTesting] = useState(false)

  // Cargar credenciales guardadas en Supabase
  useEffect(() => {
    const sbToken = typeof window !== 'undefined' ? localStorage.getItem('supabase_access_token') : null
    const gToken = typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null

    // Cargar desde Supabase
    if (sbToken) {
      fetch('/api/credenciales', { headers: { 'x-sb-token': sbToken } })
        .then((r) => r.json())
        .then((d) => {
          const c = d.creds || {}
          // Marcar como configurados los que ya tienen valor en DB
          const newStatus: Record<string, boolean> = {}
          if (c.google_client_id) newStatus['GOOGLE_CLIENT_ID'] = true
          if (c.google_client_secret) newStatus['GOOGLE_CLIENT_SECRET'] = true
          if (c.openai_api_key) newStatus['OPENAI_API_KEY'] = true
          if (c.places_api_key) newStatus['GOOGLE_PLACES_API_KEY'] = true
          if (c.google_sheet_id) newStatus['GOOGLE_SHEET_ID'] = true
          setStatus(newStatus)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    // Testear Drive si hay token
    if (gToken) testDrive(gToken)
  }, [])

  const testDrive = async (tokenOverride?: string) => {
    const token = tokenOverride || (typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null)
    if (!token) {
      setDriveStatus({ ok: false, msg: 'No conectado — hacé Login con Google primero' })
      return
    }
    setDriveTesting(true)
    setDriveStatus(null)
    try {
      const res = await fetch('/api/sheets', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.error) {
        setDriveStatus({ ok: false, msg: data.error })
      } else {
        const count = (data.files || []).length
        setDriveStatus({ ok: true, msg: `Conectado — ${count} spreadsheet${count !== 1 ? 's' : ''} en tu Drive`, count })
      }
    } catch (e: any) {
      setDriveStatus({ ok: false, msg: e.message || 'Error de red' })
    }
    setDriveTesting(false)
  }

  const verify = async (type: string, key?: string) => {
    setVerifying((p) => ({ ...p, [type]: true }))
    try {
      const res = await fetch('/api/setup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, key }),
      })
      const data = await res.json()
      setVerifyResult((p) => ({ ...p, [type]: data }))
    } catch (e: any) {
      setVerifyResult((p) => ({ ...p, [type]: { ok: false, msg: e.message } }))
    }
    setVerifying((p) => ({ ...p, [type]: false }))
  }

  const connectGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const set = (key: keyof Creds, val: string) =>
    setCreds((prev) => ({ ...prev, [key]: val }))

  const toggleShow = (key: string) =>
    setShow((prev) => ({ ...prev, [key]: !prev[key] }))

  const save = async () => {
    if (!creds.GOOGLE_CLIENT_ID && !status['GOOGLE_CLIENT_ID']) {
      return setResult({ ok: false, msg: 'El Google Client ID es obligatorio' })
    }
    if (!creds.OPENAI_API_KEY && !status['OPENAI_API_KEY']) {
      return setResult({ ok: false, msg: 'La OpenAI API Key es obligatoria' })
    }

    const sbToken = typeof window !== 'undefined' ? localStorage.getItem('supabase_access_token') : null
    if (!sbToken) return setResult({ ok: false, msg: 'No hay sesión activa. Ingresá con Google primero.' })

    setSaving(true)
    setResult(null)

    const res = await fetch('/api/credenciales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sb-token': sbToken },
      body: JSON.stringify({
        creds: {
          google_client_id: creds.GOOGLE_CLIENT_ID,
          google_client_secret: creds.GOOGLE_CLIENT_SECRET,
          openai_api_key: creds.OPENAI_API_KEY,
          places_api_key: creds.GOOGLE_PLACES_API_KEY,
          google_sheet_id: creds.GOOGLE_SHEET_ID,
        },
      }),
    })
    const data = await res.json()

    if (data.ok) {
      const newStatus: Record<string, boolean> = { ...status }
      if (creds.GOOGLE_CLIENT_ID) newStatus['GOOGLE_CLIENT_ID'] = true
      if (creds.GOOGLE_CLIENT_SECRET) newStatus['GOOGLE_CLIENT_SECRET'] = true
      if (creds.OPENAI_API_KEY) newStatus['OPENAI_API_KEY'] = true
      if (creds.GOOGLE_PLACES_API_KEY) newStatus['GOOGLE_PLACES_API_KEY'] = true
      if (creds.GOOGLE_SHEET_ID) newStatus['GOOGLE_SHEET_ID'] = true
      setStatus(newStatus)
      setCreds(EMPTY)
      setResult({ ok: true, msg: '✓ Credenciales guardadas en tu cuenta' })
    } else {
      setResult({ ok: false, msg: data.error || 'Error guardando credenciales' })
    }
    setSaving(false)
  }
    setSaving(false)
  }

  const allReady =
    status['GOOGLE_CLIENT_ID'] &&
    status['GOOGLE_CLIENT_SECRET'] &&
    status['OPENAI_API_KEY'] &&
    status['NEXTAUTH_SECRET']

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
      {/* Glow de fondo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30 flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text">Configurar credenciales</h1>
            <p className="text-text-dim font-body text-sm mt-0.5">
              Pegá tus API keys — se guardan en <code className="text-accent font-mono text-xs bg-surface-2 px-1.5 py-0.5 rounded">.env.local</code>
            </p>
          </div>
        </div>

        {/* Estado general */}
        {!loading && (
          <div className={`card mb-6 flex items-center gap-4 ${allReady ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${allReady ? 'bg-success/20' : 'bg-warning/20'}`}>
              <span className="text-xl">{allReady ? '✅' : '⚠️'}</span>
            </div>
            <div>
              <p className={`font-display text-sm font-semibold ${allReady ? 'text-success' : 'text-warning'}`}>
                {allReady ? 'App lista para usar' : 'Faltan credenciales'}
              </p>
              <p className="text-text-dim text-xs font-body mt-0.5">
                {allReady
                  ? 'Todas las API keys están configuradas correctamente'
                  : 'Completá los campos con fondo rojo para que la app funcione'}
              </p>
            </div>
          </div>
        )}

        {/* Indicadores de estado */}
        {!loading && (
          <div className="grid grid-cols-2 gap-2 mb-6">
            {[
              { key: 'GOOGLE_CLIENT_ID', label: 'Google Client ID', required: true },
              { key: 'GOOGLE_CLIENT_SECRET', label: 'Google Client Secret', required: true },
              { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', required: true },
              { key: 'GOOGLE_PLACES_API_KEY', label: 'Places API Key', required: false },
              { key: 'NEXTAUTH_SECRET', label: 'NextAuth Secret', required: true },
            ].map(({ key, label, required }) => (
              <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono ${
                status[key]
                  ? 'bg-success/8 border-success/25 text-success'
                  : required
                    ? 'bg-danger/8 border-danger/25 text-danger'
                    : 'bg-surface-2 border-border text-muted'
              }`}>
                <span>{status[key] ? '✓' : required ? '✗' : '○'}</span>
                <span className="truncate">{label}</span>
                {!required && !status[key] && <span className="ml-auto text-muted/60">opcional</span>}
              </div>
            ))}
          </div>
        )}

        {/* ── Formulario ── */}

        {/* Google OAuth */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <GoogleIcon />
            </div>
            <h2 className="font-display text-sm font-semibold text-text">Google OAuth</h2>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-accent font-mono hover:underline"
            >
              Abrir Google Cloud →
            </a>
          </div>

          <Field
            label="Client ID"
            keyName="GOOGLE_CLIENT_ID"
            value={creds.GOOGLE_CLIENT_ID}
            onChange={(v) => set('GOOGLE_CLIENT_ID', v)}
            placeholder="123456789-abcdef.apps.googleusercontent.com"
            isSet={status['GOOGLE_CLIENT_ID']}
            show={show['cid']}
            onToggle={() => toggleShow('cid')}
            required
          />

          <Field
            label="Client Secret"
            keyName="GOOGLE_CLIENT_SECRET"
            value={creds.GOOGLE_CLIENT_SECRET}
            onChange={(v) => set('GOOGLE_CLIENT_SECRET', v)}
            placeholder="GOCSPX-..."
            isSet={status['GOOGLE_CLIENT_SECRET']}
            show={show['csecret']}
            onToggle={() => toggleShow('csecret')}
            required
          />

          {/* Estado real de conexión con Drive */}
          <div className={`mt-4 rounded-xl border p-4 ${
            driveStatus?.ok
              ? 'bg-green-950/40 border-green-800/50'
              : driveStatus && !driveStatus.ok
              ? 'bg-red-950/40 border-red-800/50'
              : 'bg-surface-2 border-border'
          }`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                {driveTesting ? (
                  <span className="text-xs text-text-muted animate-pulse">Verificando conexión con Drive...</span>
                ) : driveStatus?.ok ? (
                  <p className="text-sm font-semibold text-green-400">✓ {driveStatus.msg}</p>
                ) : driveStatus ? (
                  <>
                    <p className="text-sm font-medium text-red-400">✗ {driveStatus.msg}</p>
                    <p className="text-xs text-text-muted mt-1">Ir a <a href="/login" className="text-accent underline">Login</a> y conectar con Google para obtener acceso a Drive.</p>
                  </>
                ) : (
                  <p className="text-xs text-text-muted">Sin sesión Google activa. El acceso a Drive se obtiene al hacer Login con Google.</p>
                )}
              </div>
              {driveStatus?.ok && (
                <button onClick={() => testDrive()} disabled={driveTesting} className="btn-secondary text-xs px-3 py-1.5">
                  {driveTesting ? '...' : '🔄 Re-verificar'}
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 bg-surface-2 rounded-xl px-4 py-3 border border-border">
            <p className="text-text-dim text-xs font-mono leading-relaxed">
              📋 En Google Cloud Console → APIs y servicios → Credenciales → Crear credencial → OAuth 2.0<br/>
              Redirect URI: <code className="text-accent">{typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback</code>
            </p>
          </div>
        </div>

        {/* OpenAI */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-sm">🤖</div>
            <h2 className="font-display text-sm font-semibold text-text">OpenAI</h2>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-accent font-mono hover:underline"
            >
              Abrir OpenAI →
            </a>
          </div>

          <Field
            label="API Key"
            keyName="OPENAI_API_KEY"
            value={creds.OPENAI_API_KEY}
            onChange={(v) => set('OPENAI_API_KEY', v)}
            placeholder="sk-proj-..."
            isSet={status['OPENAI_API_KEY']}
            show={show['oai']}
            onToggle={() => toggleShow('oai')}
            required
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => verify('openai', creds.OPENAI_API_KEY || undefined)}
              disabled={verifying['openai']}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {verifying['openai'] ? '...' : '🔍 Verificar OpenAI'}
            </button>
            {verifyResult['openai'] && (
              <span className={`text-xs font-mono ${
                verifyResult['openai'].ok ? 'text-green-400' : 'text-red-400'
              }`}>
                {verifyResult['openai'].msg}
              </span>
            )}
          </div>
        </div>

        {/* Google Places */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-sm">📍</div>
            <h2 className="font-display text-sm font-semibold text-text">Google Places API</h2>
            <span className="ml-auto text-xs text-muted font-mono bg-surface-2 px-2 py-0.5 rounded-full border border-border">opcional</span>
          </div>

          <Field
            label="API Key"
            keyName="GOOGLE_PLACES_API_KEY"
            value={creds.GOOGLE_PLACES_API_KEY}
            onChange={(v) => set('GOOGLE_PLACES_API_KEY', v)}
            placeholder="AIzaSy..."
            isSet={status['GOOGLE_PLACES_API_KEY']}
            show={show['places']}
            onToggle={() => toggleShow('places')}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => verify('places', creds.GOOGLE_PLACES_API_KEY || undefined)}
              disabled={verifying['places']}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {verifying['places'] ? '...' : '🔍 Verificar Places'}
            </button>
            {verifyResult['places'] && (
              <span className={`text-xs font-mono ${
                verifyResult['places'].ok ? 'text-green-400' : 'text-red-400'
              }`}>
                {verifyResult['places'].msg}
              </span>
            )}
          </div>

          <p className="text-muted text-xs font-mono mt-2">
            Google Cloud → APIs → Habilitar "Places API (New)" → Credenciales → API Key
          </p>
        </div>

        {/* Cuenta permitida */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-sm">👤</div>
            <h2 className="font-display text-sm font-semibold text-text">Cuenta de Google permitida</h2>
          </div>

          <Field
            label="Email autorizado"
            keyName="ALLOWED_EMAIL"
            value={creds.ALLOWED_EMAIL}
            onChange={(v) => set('ALLOWED_EMAIL', v)}
            placeholder="tu@gmail.com"
            isSet={status['ALLOWED_EMAIL']}
            show={show['email']}
            onToggle={() => toggleShow('email')}
            required
          />

          <p className="text-muted text-xs font-mono mt-2">
            Solo este email podrá hacer login con Google en la app
          </p>
        </div>

        {/* Google Sheet ID */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center text-sm">📊</div>
            <h2 className="font-display text-sm font-semibold text-text">Google Sheet principal</h2>
          </div>

          <Field
            label="Spreadsheet ID"
            keyName="GOOGLE_SHEET_ID"
            value={creds.GOOGLE_SHEET_ID}
            onChange={(v) => set('GOOGLE_SHEET_ID', v)}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            isSet={status['GOOGLE_SHEET_ID']}
            show={show['sheetid']}
            onToggle={() => toggleShow('sheetid')}
            required
          />

          <div className="mt-3 bg-surface-2 rounded-xl px-4 py-3 border border-border">
            <p className="text-text-dim text-xs font-mono leading-relaxed">
              📋 El ID está en la URL de tu Google Sheet:<br/>
              <span className="text-accent">https://docs.google.com/spreadsheets/d/<strong>ESTE_ES_EL_ID</strong>/edit</span>
            </p>
          </div>
        </div>

        {/* Nota NextAuth */}
        <div className="card mb-6 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${status['NEXTAUTH_SECRET'] ? 'bg-success/20' : 'bg-accent/20'}`}>
            <span>{status['NEXTAUTH_SECRET'] ? '✅' : '⚡'}</span>
          </div>
          <div>
            <p className="text-text text-sm font-display font-medium">
              NextAuth Secret — {status['NEXTAUTH_SECRET'] ? 'ya generado' : 'se genera automáticamente'}
            </p>
            <p className="text-text-dim text-xs font-body mt-0.5">
              {status['NEXTAUTH_SECRET']
                ? 'Ya existe un secret configurado, no es necesario regenerarlo'
                : 'Al guardar, generamos un string aleatorio seguro por vos'}
            </p>
          </div>
        </div>

        {/* Resultado */}
        {result && (
          <div className={`card mb-4 ${result.ok ? 'border-success/40 bg-success/5' : 'border-danger/40 bg-danger/5'}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{result.ok ? '✅' : '❌'}</span>
              <div className="flex-1">
                <p className={`font-body text-sm ${result.ok ? 'text-success' : 'text-danger'}`}>
                  {result.msg}
                </p>
                {result.ok && (
                  <div className="mt-3 bg-bg rounded-xl border border-border p-3">
                    <p className="text-text-dim text-xs font-mono mb-2">
                      ⚠️ Reiniciá el servidor para que los cambios tomen efecto:
                    </p>
                    <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2">
                      <code className="text-accent font-mono text-sm flex-1">Ctrl + C → npm run dev</code>
                      <button
                        onClick={() => navigator.clipboard.writeText('npm run dev')}
                        className="text-muted hover:text-text text-xs transition-colors"
                      >
                        copiar
                      </button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => router.push('/login')}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        Ir al Login →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botón guardar */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full btn-primary justify-center py-4 text-base"
          style={{ background: saving ? undefined : 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Spinner /> Guardando en .env.local...
            </span>
          ) : (
            '💾 Guardar credenciales'
          )}
        </button>

        <p className="text-center text-muted text-xs font-mono mt-4">
          Esta pantalla siempre disponible en <code className="text-accent">/setup</code>
        </p>
      </div>
      </main>
    </div>
  )
}

// ─── Componente de campo ──────────────────────────────────────────────────────
function Field({
  label, keyName, value, onChange, placeholder, isSet, show, onToggle, required = false
}: {
  label: string; keyName: string; value: string; onChange: (v: string) => void
  placeholder: string; isSet?: boolean; show: boolean; onToggle: () => void; required?: boolean
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-2 mb-1">
        <label className="label mb-0 flex-1">{label}</label>
        {isSet ? (
          <span className="text-success text-xs font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> configurado
          </span>
        ) : required ? (
          <span className="text-danger text-xs font-mono">requerido</span>
        ) : null}
      </div>
      <div className="flex gap-2">
        <input
          className={`input flex-1 font-mono text-xs ${!isSet && required && !value ? 'border-danger/50 focus:border-danger' : ''}`}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isSet ? '(ya configurado — pegá uno nuevo para reemplazar)' : placeholder}
        />
        <button
          onClick={onToggle}
          className="btn-secondary px-3 py-2 flex-shrink-0 text-base"
          title={show ? 'Ocultar' : 'Mostrar'}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
