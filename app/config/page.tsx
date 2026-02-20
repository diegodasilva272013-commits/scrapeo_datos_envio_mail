'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const DEFAULT_CONFIG = {
  country: 'Argentina',
  region: 'Córdoba',
  city: 'Córdoba',
  niche: '',
  senderName: '',
  senderRole: 'CEO',
  senderEmail: '',
  companyName: '',
  companyLink: '',
  saludo: 'Un saludo',
  emailsPerDay: '10',
  scheduleHour: '6',
  scheduleDays: '1,2,3,4,5',
  spreadsheetId: '',
}

export default function ConfigPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [sheets, setSheets] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Auth bypass para testing
  // useEffect(() => {
  //   if (status === 'unauthenticated') router.push('/login')
  // }, [status, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/sheets')
      .then((r) => r.json())
      .then((d) => setSheets(d.files || []))
  }, [session])

  useEffect(() => {
    if (!spreadsheetId) return
    fetch(`/api/config?spreadsheetId=${spreadsheetId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.config && Object.keys(d.config).length > 0) {
          setConfig((prev) => ({ ...prev, ...d.config }))
        }
      })
  }, [spreadsheetId])

  const save = async () => {
    if (!spreadsheetId) return alert('Seleccioná una spreadsheet primero')
    setSaving(true)
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadsheetId, config }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const set = (key: string, val: string) => setConfig((prev) => ({ ...prev, [key]: val }))

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 animate-slide-up">
            <h1 className="font-display text-3xl font-bold text-text">Configuración</h1>
            <p className="text-text-dim font-body mt-1">
              Todos los ajustes se guardan en la pestaña CONFIG de tu Sheet
            </p>
          </div>

          {/* Sheet selector */}
          <div className="card mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <label className="label">Spreadsheet activa</label>
            <select
              className="input"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
            >
              <option value="">— Elegí una sheet —</option>
              {sheets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Ubicación */}
          <Section title="📍 Ubicación de búsqueda" delay="0.1s">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">País</label>
                <input className="input" value={config.country} onChange={(e) => set('country', e.target.value)} placeholder="Argentina" />
              </div>
              <div>
                <label className="label">Región / Provincia</label>
                <input className="input" value={config.region} onChange={(e) => set('region', e.target.value)} placeholder="Córdoba" />
              </div>
              <div>
                <label className="label">Ciudad</label>
                <input className="input" value={config.city} onChange={(e) => set('city', e.target.value)} placeholder="Córdoba" />
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Nicho / Keyword</label>
              <input className="input" value={config.niche} onChange={(e) => set('niche', e.target.value)} placeholder="dentistas, abogados, clínicas..." />
              <p className="text-muted text-xs font-mono mt-1">Si lo dejás vacío, OpenAI elige uno al azar cada vez</p>
            </div>
          </Section>

          {/* Firma */}
          <Section title="✍️ Firma del email" delay="0.15s">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nombre del remitente</label>
                <input className="input" value={config.senderName} onChange={(e) => set('senderName', e.target.value)} placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="label">Cargo</label>
                <input className="input" value={config.senderRole} onChange={(e) => set('senderRole', e.target.value)} placeholder="CEO" />
              </div>
              <div>
                <label className="label">Email remitente (tu cuenta conectada)</label>
                <input className="input" type="email" value={config.senderEmail} onChange={(e) => set('senderEmail', e.target.value)} placeholder="vos@tuempresa.com" />
              </div>
              <div>
                <label className="label">Saludo final</label>
                <input className="input" value={config.saludo} onChange={(e) => set('saludo', e.target.value)} placeholder="Un saludo" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="label">Nombre de empresa</label>
                <input className="input" value={config.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="label">Link empresa (WhatsApp o landing)</label>
                <input className="input" value={config.companyLink} onChange={(e) => set('companyLink', e.target.value)} placeholder="https://wa.me/..." />
              </div>
            </div>
          </Section>

          {/* Límites */}
          <Section title="⚙️ Límites y Schedule" delay="0.2s">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Emails por ejecución</label>
                <input className="input" type="number" value={config.emailsPerDay} onChange={(e) => set('emailsPerDay', e.target.value)} min={1} max={200} />
                <p className="text-muted text-xs font-mono mt-1">Equivalente al nodo Limit (default: 10)</p>
              </div>
              <div>
                <label className="label">Hora de ejecución automática</label>
                <input className="input" type="number" value={config.scheduleHour} onChange={(e) => set('scheduleHour', e.target.value)} min={0} max={23} />
                <p className="text-muted text-xs font-mono mt-1">Formato 24h (ej: 6 = 6:00 AM)</p>
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Días activos (cron: 1=Lun, 5=Vie)</label>
              <input className="input" value={config.scheduleDays} onChange={(e) => set('scheduleDays', e.target.value)} placeholder="1,2,3,4,5" />
            </div>
          </Section>

          {/* Guardar */}
          <div className="flex justify-end mt-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <button onClick={save} disabled={saving || !spreadsheetId} className="btn-primary px-8">
              {saving ? '⏳ Guardando...' : saved ? '✅ Guardado!' : '💾 Guardar config'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children, delay = '0s' }: { title: string; children: React.ReactNode; delay?: string }) {
  return (
    <div className="card mb-4 animate-slide-up" style={{ animationDelay: delay }}>
      <h2 className="font-display text-base font-semibold text-text mb-4">{title}</h2>
      {children}
    </div>
  )
}
