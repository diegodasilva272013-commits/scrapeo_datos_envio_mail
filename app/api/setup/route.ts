import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const ENV_PATH = path.join(process.cwd(), '.env.local')

// ─── Leer .env.local actual ───────────────────────────────────────────────────
function readEnvFile(): Record<string, string> {
  try {
    const content = fs.readFileSync(ENV_PATH, 'utf-8')
    const vars: Record<string, string> = {}
    content.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx < 0) return
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim()
      if (key) vars[key] = val
    })
    return vars
  } catch {
    return {}
  }
}

// ─── GET: Devuelve qué keys ya están configuradas (sin exponer valores) ───────
export async function GET() {
  const vars = readEnvFile()

  // Solo devolvemos true/false por key, nunca el valor real
  const status: Record<string, boolean> = {
    GOOGLE_CLIENT_ID: Boolean(vars['GOOGLE_CLIENT_ID']),
    GOOGLE_CLIENT_SECRET: Boolean(vars['GOOGLE_CLIENT_SECRET']),
    OPENAI_API_KEY: Boolean(vars['OPENAI_API_KEY']),
    GOOGLE_PLACES_API_KEY: Boolean(vars['GOOGLE_PLACES_API_KEY']),
    NEXTAUTH_SECRET: Boolean(vars['NEXTAUTH_SECRET']),
    NEXTAUTH_URL: Boolean(vars['NEXTAUTH_URL']),
    ALLOWED_EMAIL:  Boolean(vars['ALLOWED_EMAIL'] && vars['ALLOWED_EMAIL'].includes('@')),
    GOOGLE_SHEET_ID: Boolean(vars['GOOGLE_SHEET_ID']),
  }

  return NextResponse.json({ status })
}

// ─── POST: Escribe .env.local con las credenciales que vienen de la UI ────────
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { credentials } = body as {
    credentials: {
      GOOGLE_CLIENT_ID?: string
      GOOGLE_CLIENT_SECRET?: string
      OPENAI_API_KEY?: string
      GOOGLE_PLACES_API_KEY?: string
      ALLOWED_EMAIL?: string
      GOOGLE_SHEET_ID?: string
    }
  }

  // Leer vars existentes para hacer merge (no pisar lo que no se toca)
  const existing = readEnvFile()

  // Merge: solo actualizar los que vienen con valor no vacío
  const merged: Record<string, string> = { ...existing }

  if (credentials.GOOGLE_CLIENT_ID?.trim())
    merged['GOOGLE_CLIENT_ID'] = credentials.GOOGLE_CLIENT_ID.trim()

  if (credentials.GOOGLE_CLIENT_SECRET?.trim())
    merged['GOOGLE_CLIENT_SECRET'] = credentials.GOOGLE_CLIENT_SECRET.trim()

  if (credentials.OPENAI_API_KEY?.trim())
    merged['OPENAI_API_KEY'] = credentials.OPENAI_API_KEY.trim()

  if (credentials.GOOGLE_PLACES_API_KEY?.trim())
    merged['GOOGLE_PLACES_API_KEY'] = credentials.GOOGLE_PLACES_API_KEY.trim()

  if (credentials.ALLOWED_EMAIL?.trim())
    merged['ALLOWED_EMAIL'] = credentials.ALLOWED_EMAIL.trim()

  if (credentials.GOOGLE_SHEET_ID?.trim())
    merged['GOOGLE_SHEET_ID'] = credentials.GOOGLE_SHEET_ID.trim()

  // NEXTAUTH_SECRET: generarlo si no existe
  if (!merged['NEXTAUTH_SECRET']) {
    merged['NEXTAUTH_SECRET'] = crypto.randomBytes(48).toString('base64')
  }

  // NEXTAUTH_URL: default a localhost si no está
  if (!merged['NEXTAUTH_URL']) {
    merged['NEXTAUTH_URL'] = 'http://localhost:3000'
  }

  // Validaciones mínimas
  if (!merged['GOOGLE_CLIENT_ID']) {
    return NextResponse.json({ error: 'El Google Client ID es obligatorio' }, { status: 400 })
  }
  if (!merged['GOOGLE_CLIENT_SECRET']) {
    return NextResponse.json({ error: 'El Google Client Secret es obligatorio' }, { status: 400 })
  }
  if (!merged['OPENAI_API_KEY']) {
    return NextResponse.json({ error: 'La OpenAI API Key es obligatoria' }, { status: 400 })
  }

  // Escribir .env.local
  const lines = [
    '# ══════════════════════════════════════════════════════════',
    '# LeadFlow — Variables de entorno',
    '# Generado automáticamente desde /setup',
    '# ══════════════════════════════════════════════════════════',
    '',
    '# Google OAuth (desde Google Cloud Console)',
    `GOOGLE_CLIENT_ID=${merged['GOOGLE_CLIENT_ID']}`,
    `GOOGLE_CLIENT_SECRET=${merged['GOOGLE_CLIENT_SECRET']}`,
    '',
    '# NextAuth (generado automáticamente)',
    `NEXTAUTH_SECRET=${merged['NEXTAUTH_SECRET']}`,
    `NEXTAUTH_URL=${merged['NEXTAUTH_URL']}`,
    '',
    '# OpenAI',
    `OPENAI_API_KEY=${merged['OPENAI_API_KEY']}`,
    '',
    '# Google Places API Key (para buscar en Google Maps)',
    `GOOGLE_PLACES_API_KEY=${merged['GOOGLE_PLACES_API_KEY'] || ''}`,
    '',
    '# Solo este email puede hacer login',
    `ALLOWED_EMAIL=${merged['ALLOWED_EMAIL'] || ''}`,
    '',
    '# ID de la Google Spreadsheet principal',
    `GOOGLE_SHEET_ID=${merged['GOOGLE_SHEET_ID'] || ''}`,
  ]

  try {
    fs.writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf-8')
  } catch (err) {
    return NextResponse.json(
      { error: `No se pudo escribir .env.local: ${String(err)}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: '.env.local guardado correctamente. Reiniciá el servidor para aplicar los cambios.',
  })
}
