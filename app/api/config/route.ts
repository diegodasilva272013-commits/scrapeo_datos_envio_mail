import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readKVTab, writeKVTab } from '@/lib/googleSheets'

function getSheetId(searchParams?: URLSearchParams): string | null {
  return searchParams?.get('spreadsheetId') || process.env.GOOGLE_SHEET_ID || null
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const spreadsheetId = getSheetId(new URL(req.url).searchParams)
  if (!spreadsheetId) return NextResponse.json({ error: 'GOOGLE_SHEET_ID no configurado. Ir a /setup.' }, { status: 400 })
  const config = await readKVTab(session.accessToken, spreadsheetId, 'CONFIG')
  return NextResponse.json({ config, spreadsheetId })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  const body = await req.json()
  const spreadsheetId = getSheetId() || body.spreadsheetId
  if (!spreadsheetId) return NextResponse.json({ error: 'GOOGLE_SHEET_ID no configurado. Ir a /setup.' }, { status: 400 })
  await writeKVTab(session.accessToken, spreadsheetId, 'CONFIG', body.config)
  return NextResponse.json({ success: true })
}
