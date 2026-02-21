'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import LogViewer from '@/components/LogViewer'
import SinAcceso from '@/components/SinAcceso'
import { usuarioActivo } from '@/lib/supabase'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tieneAcceso, setTieneAcceso] = useState<boolean | null>(null)

  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [sheetName, setSheetName] = useState('LEADS')
  const [sheets, setSheets] = useState<{ id: string; name: string }[]>([])
  const [tabs, setTabs] = useState<{ id: number; name: string }[]>([])
  const [emailsPerDay, setEmailsPerDay] = useState(10)

  const [logsA, setLogsA] = useState<string[]>([])
  const [logsB, setLogsB] = useState<string[]>([])
  const [runningA, setRunningA] = useState(false)
  const [runningB, setRunningB] = useState(false)

  const [stats, setStats] = useState({ total: 0, pending: 0, sent: 0 })
  const [apiStatus, setApiStatus] = useState<Record<string, boolean>>({})
  const [apiChecked, setApiChecked] = useState(false)

  useEffect(() => {
    if (!session?.user?.email) return
    usuarioActivo(session.user.email).then(setTieneAcceso)
  }, [session])

  // Verificar si las API keys están configuradas
  useEffect(() => {
    fetch('/api/setup')
      .then((r) => r.json())
      .then((d) => { setApiStatus(d.status || {}); setApiChecked(true) })
      .catch(() => setApiChecked(true))
  }, [])

  // Cargar spreadsheets
  useEffect(() => {
    if (!session) return
    fetch('/api/sheets')
      .then((r) => r.json())
      .then((d) => setSheets(d.files || []))
  }, [session])

  // Cargar tabs cuando se elige una sheet
  useEffect(() => {
    if (!spreadsheetId) return
    fetch(`/api/sheets?spreadsheetId=${spreadsheetId}`)
      .then((r) => r.json())
      .then((d) => setTabs(d.tabs || []))
    loadStats()
    // eslint-disable-next-line
  }, [spreadsheetId])

  const loadStats = async () => {
    if (!spreadsheetId) return
    const res = await fetch(`/api/leads?spreadsheetId=${spreadsheetId}&sheetName=${sheetName}`)
    const data = await res.json()
    const rows: Record<string, string>[] = data.rows || []
    setStats({
      total: rows.length,
      pending: rows.filter((r) => r['Estado'] === 'Sin enviar').length,
      sent: rows.filter((r) => r['Estado'] === 'Enviado').length,
    })
  }

  const createFromTemplate = async () => {
    const res = await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'LeadFlow - Leads' }),
    })
    const data = await res.json()
    setSpreadsheetId(data.spreadsheetId)
    window.open(data.url, '_blank')
  }

  const runWorkflowA = async () => {
    if (!spreadsheetId) return alert('Seleccioná una spreadsheet primero')
    setRunningA(true)
    setLogsA([])

    const res = await fetch('/api/workflow-a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadsheetId, sheetName, emailsPerDay }),
    })
    const data = await res.json()
    setLogsA(data.logs || [])
    setRunningA(false)
    loadStats()
  }

  const runWorkflowB = async () => {
    if (!spreadsheetId) return alert('Seleccioná una spreadsheet primero')
    setRunningB(true)
    setLogsB([])

    const res = await fetch('/api/workflow-b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadsheetId, sheetName, emailsPerDay }),
    })
    const data = await res.json()
    setLogsB(data.logs || [])
    setRunningB(false)
    loadStats()
  }

  if (status === 'loading' || tieneAcceso === null) return null
  if (tieneAcceso === false) return <SinAcceso />

  const needsSetup = apiChecked && (!apiStatus['GOOGLE_CLIENT_ID'] || !apiStatus['OPENAI_API_KEY'])
  const needsLogin = !session && apiChecked && apiStatus['GOOGLE_CLIENT_ID']

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <h1 className="font-display text-3xl font-bold text-text">Dashboard</h1>
            <p className="text-text-dim font-body mt-1">
              Controlá tu pipeline de prospección automatizada
            </p>
          </div>

          {/* Banner: Necesita configurar API keys */}
          {needsSetup && (
            <div className="card mb-6 border-warning/40 bg-warning/5 animate-slide-up">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-base font-semibold text-warning">Credenciales no configuradas</h3>
                  <p className="text-text-dim text-sm font-body mt-1">
                    Para usar LeadFlow necesitás configurar tus API keys de Google Cloud y OpenAI.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => router.push('/setup')} className="btn-primary text-sm px-4 py-2" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                      🔑 Configurar API Keys
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Banner: Necesita loguearse con Google */}
          {needsLogin && (
            <div className="card mb-6 border-accent/40 bg-accent/5 animate-slide-up">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔐</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-base font-semibold text-accent">Falta iniciar sesión con Google</h3>
                  <p className="text-text-dim text-sm font-body mt-1">
                    Las API keys están configuradas. Ahora necesitás loguearte con Google para acceder a Sheets y Gmail.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => router.push('/login')} className="btn-primary text-sm px-4 py-2">
                      🔑 Ir al Login
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sheet selector */}
          <div className="card mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <h2 className="font-display text-base font-semibold text-text mb-4">
              📋 Google Spreadsheet
            </h2>
            <div className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-48">
                <label className="label">Elegir spreadsheet</label>
                <select
                  className="input"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                >
                  <option value="">— Seleccioná una sheet —</option>
                  {sheets.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              {tabs.length > 0 && (
                <div className="w-48">
                  <label className="label">Tab (pestaña)</label>
                  <select
                    className="input"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                  >
                    {tabs.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <button onClick={createFromTemplate} className="btn-secondary whitespace-nowrap">
                ✨ Crear desde template
              </button>
            </div>
          </div>

          {/* Stats */}
          {spreadsheetId && (
            <div className="grid grid-cols-3 gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <StatCard label="Total Leads" value={stats.total} color="text-text" />
              <StatCard label="Pendientes" value={stats.pending} color="text-warning" />
              <StatCard label="Enviados" value={stats.sent} color="text-success" />
            </div>
          )}

          {/* Acciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workflow A */}
            <div className="card animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-2xl mb-1">🔍</div>
                  <h2 className="font-display text-lg font-semibold text-text">Scrapear Leads</h2>
                  <p className="text-text-dim text-sm font-body mt-1">
                    Busca negocios en Google Maps, extrae emails y los guarda en tu Sheet.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="label">Emails por día (límite)</label>
                <input
                  type="number"
                  className="input"
                  value={emailsPerDay}
                  onChange={(e) => setEmailsPerDay(Number(e.target.value))}
                  min={1}
                  max={100}
                />
              </div>

              <button
                onClick={runWorkflowA}
                disabled={runningA || !spreadsheetId}
                className="btn-primary w-full justify-center"
                style={{ background: runningA ? undefined : 'linear-gradient(135deg, #6366f1, #818cf8)' }}
              >
                {runningA ? (
                  <>
                    <Spinner /> Scrapando...
                  </>
                ) : (
                  '🚀 Scrapear ahora'
                )}
              </button>

              <LogViewer logs={logsA} running={runningA} />
            </div>

            {/* Workflow B */}
            <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-2xl mb-1">✉️</div>
                  <h2 className="font-display text-lg font-semibold text-text">Enviar Icebreakers</h2>
                  <p className="text-text-dim text-sm font-body mt-1">
                    Scrapea las webs, genera emails personalizados con IA y los envía por Gmail.
                  </p>
                </div>
              </div>

              <div className="mb-4 bg-surface-2 rounded-xl px-4 py-3 border border-border">
                <p className="text-text-dim text-xs font-mono">
                  📌 Solo procesa filas con Estado = <span className="text-warning">"Sin enviar"</span>
                </p>
                <p className="text-text-dim text-xs font-mono mt-1">
                  📦 Límite: <span className="text-accent font-semibold">{emailsPerDay}</span> emails por ejecución
                </p>
              </div>

              <button
                onClick={runWorkflowB}
                disabled={runningB || !spreadsheetId}
                className="btn-primary w-full justify-center"
                style={{ background: runningB ? undefined : 'linear-gradient(135deg, #10b981, #34d399)' }}
              >
                {runningB ? (
                  <>
                    <Spinner /> Enviando...
                  </>
                ) : (
                  '📤 Enviar ahora'
                )}
              </button>

              <LogViewer logs={logsB} running={runningB} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card text-center">
      <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-muted text-xs font-mono mt-1 uppercase tracking-wider">{label}</div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-accent font-mono text-sm animate-pulse">Cargando...</div>
    </div>
  )
}
