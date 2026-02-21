import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ENV_PATH = path.join(process.cwd(), '.env.local')

function readEnv(): Record<string, string> {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8')
    const vars: Record<string, string> = {}
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const idx = trimmed.indexOf('=')
      if (idx < 0) return
      vars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
    })
    return vars
  } catch { return {} }
}

export async function POST(req: NextRequest) {
  const { clientId, clientSecret, sheetId } = await req.json()

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Client ID y Client Secret son obligatorios' }, { status: 400 })
  }

  const env = readEnv()
  if (clientId) env['GOOGLE_CLIENT_ID'] = clientId
  if (clientSecret) env['GOOGLE_CLIENT_SECRET'] = clientSecret
  if (sheetId) env['GOOGLE_SHEET_ID'] = sheetId

  const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`)

  try {
    fs.writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf-8')
    return NextResponse.json({ message: 'Credenciales guardadas. Reiniciá el servidor para aplicar.' })
  } catch (e) {
    return NextResponse.json({ error: `Error guardando: ${e}` }, { status: 500 })
  }
}
