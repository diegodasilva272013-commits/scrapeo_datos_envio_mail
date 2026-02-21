import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ENV_PATH = path.join(process.cwd(), '.env.local')

function readEnvFile(): Record<string, string> {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8')
    const vars: Record<string, string> = {}
    content.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx < 0) return
      vars[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
    })
    return vars
  } catch {
    return {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, key } = await req.json()

    // Si no viene key, la leemos del .env.local
    const envVars = readEnvFile()

    if (type === 'openai') {
      const apiKey = key || envVars['OPENAI_API_KEY']
      if (!apiKey) return NextResponse.json({ ok: false, msg: 'No hay API key guardada' })

      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (res.ok) {
        const data = await res.json()
        const count = data.data?.length || 0
        return NextResponse.json({ ok: true, msg: `✓ Conectado — ${count} modelos disponibles` })
      }
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ ok: false, msg: err?.error?.message || `Error ${res.status}` })
    }

    if (type === 'places') {
      const apiKey = key || envVars['GOOGLE_PLACES_API_KEY']
      if (!apiKey) return NextResponse.json({ ok: false, msg: 'No hay API key guardada' })

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Buenos+Aires&key=${apiKey}`
      )
      const data = await res.json()
      if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
        return NextResponse.json({ ok: true, msg: '✓ Google Places API funciona correctamente' })
      }
      const msgs: Record<string, string> = {
        REQUEST_DENIED: 'Clave inválida o sin permisos para Geocoding/Places API',
        OVER_DAILY_LIMIT: 'Límite diario alcanzado',
        OVER_QUERY_LIMIT: 'Límite de consultas alcanzado',
        INVALID_REQUEST: 'Solicitud inválida',
      }
      return NextResponse.json({ ok: false, msg: msgs[data.status] || `Error: ${data.status}` })
    }

    if (type === 'google-oauth') {
      const clientId = key || envVars['GOOGLE_CLIENT_ID']
      if (!clientId) return NextResponse.json({ ok: false, msg: 'No hay Client ID guardado' })

      // Validar formato básico
      if (!clientId.endsWith('.apps.googleusercontent.com')) {
        return NextResponse.json({ ok: false, msg: 'El Client ID debe terminar en .apps.googleusercontent.com' })
      }
      // Verificar que existe en Google (discovery)
      const res = await fetch(`https://www.googleapis.com/oauth2/v1/certs`, {
        signal: AbortSignal.timeout(5000),
      }).catch(() => null)
      if (!res?.ok) return NextResponse.json({ ok: false, msg: 'No se pudo alcanzar los servidores de Google' })

      return NextResponse.json({
        ok: true,
        msg: '✓ Formato de Client ID válido. Probá el login con Google para confirmarlo al 100%',
      })
    }

    return NextResponse.json({ ok: false, msg: 'Tipo de verificación desconocido' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, msg: e.message || 'Error interno' })
  }
}
