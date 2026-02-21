'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function CredencialesPage() {
  const [form, setForm] = useState({
    clientId: '',
    clientSecret: '',
    sheetId: '',
  })
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const save = async () => {
    setSaving(true)
    setResult(null)
    const res = await fetch('/api/credenciales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setResult({ ok: res.ok, msg: data.message || data.error })
    setSaving(false)
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-text mb-2">Credenciales Google</h1>
          <p className="text-text-dim mb-8">
            Ingresá las credenciales OAuth de tu proyecto en Google Cloud Console para conectar Sheets y Gmail.
          </p>

          <div className="card mb-6">
            <h2 className="font-semibold text-text mb-4">🔑 Google OAuth 2.0</h2>

            <div className="mb-4">
              <label className="label">Client ID</label>
              <input
                className="input"
                placeholder="xxxx.apps.googleusercontent.com"
                value={form.clientId}
                onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
              />
              <p className="text-muted text-xs mt-1">Google Cloud Console → Credenciales → OAuth 2.0 → Client ID</p>
            </div>

            <div className="mb-4">
              <label className="label">Client Secret</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  type={show ? 'text' : 'password'}
                  placeholder="GOCSPX-..."
                  value={form.clientSecret}
                  onChange={e => setForm(p => ({ ...p, clientSecret: e.target.value }))}
                />
                <button
                  onClick={() => setShow(p => !p)}
                  className="px-3 border border-border rounded-lg text-muted text-sm"
                >
                  {show ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="label">Google Sheet ID</label>
              <input
                className="input"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                value={form.sheetId}
                onChange={e => setForm(p => ({ ...p, sheetId: e.target.value }))}
              />
              <p className="text-muted text-xs mt-1">
                Lo encontrás en la URL de tu Sheet: docs.google.com/spreadsheets/d/<strong>ID</strong>/edit
              </p>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-xl mb-4 text-sm border ${result.ok
              ? 'bg-green-900/30 text-green-400 border-green-800'
              : 'bg-red-900/30 text-red-400 border-red-800'}`}>
              {result.ok ? '✅ ' : '❌ '}{result.msg}
            </div>
          )}

          <button onClick={save} disabled={saving} className="btn-primary w-full py-3">
            {saving ? '⏳ Guardando...' : '💾 Guardar y conectar'}
          </button>
        </div>
      </main>
    </div>
  )
}
