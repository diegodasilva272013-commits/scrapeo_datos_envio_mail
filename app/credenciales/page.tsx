'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function CredencialesPage() {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [sheetId, setSheetId] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentials: {
          GOOGLE_CLIENT_ID: clientId,
          GOOGLE_CLIENT_SECRET: clientSecret,
          GOOGLE_SHEET_ID: sheetId,
        }
      }),
    })
    const data = await res.json()
    setMsg(data.message || data.error)
    setSaving(false)
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-text mb-6">Conectar Google Sheets</h1>

          <div className="card flex flex-col gap-4">

            <div>
              <label className="label">Client ID</label>
              <input className="input" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="xxxx.apps.googleusercontent.com" />
            </div>

            <div>
              <label className="label">Client Secret</label>
              <div className="flex gap-2">
                <input className="input flex-1" type={show ? 'text' : 'password'} value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="GOCSPX-..." />
                <button onClick={() => setShow(p => !p)} className="px-3 border border-border rounded-lg text-sm text-muted">{show ? 'Ocultar' : 'Ver'}</button>
              </div>
            </div>

            <div>
              <label className="label">Sheet ID</label>
              <input className="input" value={sheetId} onChange={e => setSheetId(e.target.value)} placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74..." />
            </div>

            {msg && <p className="text-sm text-green-400">{msg}</p>}

            <button onClick={save} disabled={saving} className="btn-primary py-3">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>

          </div>
        </div>
      </main>
    </div>
  )
}
