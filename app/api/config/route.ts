import { NextRequest, NextResponse } from 'next/server'
import { readKVTab, writeKVTab } from '@/lib/googleSheets'

function getSheetId(searchParams?: URLSearchParams): string | null {
  return searchParams?.get('spreadsheetId') || process.env.GOOGLE_SHEET_ID || null
}

function getToken(req: NextRequest): string | null {
  return req.headers.get('authorization')?.replace('Bearer ', '') || null
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = getToken(req)
    if (!accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const spreadsheetId = getSheetId(new URL(req.url).searchParams)
    if (!spreadsheetId) return NextResponse.json({ error: 'GOOGLE_SHEET_ID no configurado. Ir a /setup.' }, { status: 400 })
    const config = await readKVTab(accessToken, spreadsheetId, 'CONFIG')
    return NextResponse.json({ config, spreadsheetId })
  } catch (e: any) {
    return NextResponse.json({ config: {}, error: e.message }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = getToken(req)
    if (!accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const body = await req.json()
    const spreadsheetId = getSheetId() || body.spreadsheetId
    if (!spreadsheetId) return NextResponse.json({ error: 'GOOGLE_SHEET_ID no configurado. Ir a /setup.' }, { status: 400 })
    await writeKVTab(accessToken, spreadsheetId, 'CONFIG', body.config)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 200 })
  }
}
