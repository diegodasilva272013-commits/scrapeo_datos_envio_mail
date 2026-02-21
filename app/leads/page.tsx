'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SinAcceso from '@/components/SinAcceso'
import { usuarioActivo } from '@/lib/supabase'
import * as XLSX from 'xlsx'

type Lead = Record<string, string>

const COLUMNS = ['Web', 'Correo', 'Correo Icebreaker', 'Estado', 'Fecha Scrapeo', 'Fecha Envío', 'Ultimo Error']

export default function LeadsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tieneAcceso, setTieneAcceso] = useState<boolean | null>(null)

  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [sheets, setSheets] = useState<{ id: string; name: string }[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    if (!session?.user?.email) return
    usuarioActivo(session.user.email).then(setTieneAcceso)
  }, [session])

  useEffect(() => {
    if (!session) return
    fetch('/api/sheets')
      .then((r) => r.json())
      .then((d) => setSheets(d.files || []))
  }, [session])

  if (status === 'loading' || tieneAcceso === null) return null
  if (tieneAcceso === false) return <SinAcceso />

  const loadLeads = async () => {
    if (!spreadsheetId) return
    setLoading(true)
    const res = await fetch(`/api/leads?spreadsheetId=${spreadsheetId}&sheetName=LEADS`)
    const data = await res.json()
    setLeads(data.rows || [])
    setLoading(false)
  }

  useEffect(() => {
    if (spreadsheetId) loadLeads()
    // eslint-disable-next-line
  }, [spreadsheetId])

  const filtered = useMemo(() => {
    let rows = leads

    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((r) =>
        Object.values(r).some((v) => v?.toLowerCase().includes(q))
      )
    }

    if (filterEstado) {
      rows = rows.filter((r) => r['Estado'] === filterEstado)
    }

    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        const av = (a[sortCol] || '').toLowerCase()
        const bv = (b[sortCol] || '').toLowerCase()
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    return rows
  }, [leads, search, filterEstado, sortCol, sortDir])

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(filtered, { header: COLUMNS })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'LEADS')
    XLSX.writeFile(wb, `leadflow-export-${Date.now()}.xlsx`)
  }

  const estadoUnicos = [...new Set(leads.map((r) => r['Estado']).filter(Boolean))]

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <main className="flex-1 p-8 overflow-hidden flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 animate-slide-up">
            <div>
              <h1 className="font-display text-3xl font-bold text-text">Leads</h1>
              <p className="text-text-dim font-body mt-1">
                {filtered.length} de {leads.length} registros
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={loadLeads} className="btn-secondary text-sm px-4 py-2">
                🔄 Actualizar
              </button>
              <button onClick={exportXLSX} disabled={filtered.length === 0} className="btn-primary text-sm px-4 py-2">
                📥 Exportar XLSX
              </button>
            </div>
          </div>

          {/* Sheet selector + filtros */}
          <div className="card mb-4 flex flex-wrap gap-3 items-end animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <div className="w-64">
              <label className="label">Spreadsheet</label>
              <select className="input" value={spreadsheetId} onChange={(e) => setSpreadsheetId(e.target.value)}>
                <option value="">— Elegí una sheet —</option>
                {sheets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-48">
              <label className="label">Buscar</label>
              <input className="input" placeholder="Buscar en cualquier columna..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="w-40">
              <label className="label">Estado</label>
              <select className="input" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                <option value="">Todos</option>
                {estadoUnicos.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="flex-1 overflow-auto card p-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {loading ? (
              <div className="flex items-center justify-center h-48 text-muted font-mono text-sm">
                Cargando leads...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted gap-2">
                <span className="text-4xl">📭</span>
                <span className="font-body text-sm">Sin leads para mostrar</span>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface border-b border-border">
                  <tr>
                    {COLUMNS.map((col) => (
                      <th
                        key={col}
                        className="text-left px-4 py-3 text-text-dim font-mono text-xs uppercase tracking-wider cursor-pointer hover:text-accent transition-colors whitespace-nowrap"
                        onClick={() => toggleSort(col)}
                      >
                        {col}
                        {sortCol === col && (
                          <span className="ml-1 text-accent">{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 hover:bg-surface-2 transition-colors"
                    >
                      {COLUMNS.map((col) => (
                        <td key={col} className="px-4 py-3 text-text font-body max-w-xs">
                          {col === 'Estado' ? (
                            <EstadoBadge estado={row[col]} />
                          ) : col === 'Web' ? (
                            <a href={row[col]} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate block max-w-xs">
                              {row[col]}
                            </a>
                          ) : (
                            <span className="truncate block max-w-xs text-text-dim" title={row[col]}>
                              {row[col]}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  if (!estado) return <span className="text-muted text-xs">—</span>
  if (estado === 'Sin enviar') return <span className="badge-pending">● Sin enviar</span>
  if (estado === 'Enviado') return <span className="badge-sent">✓ Enviado</span>
  return <span className="badge bg-surface-2 text-text-dim border border-border">{estado}</span>
}
