import { NextRequest, NextResponse } from 'next/server'
import { readSheet } from '@/lib/googleSheets'

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!accessToken) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const spreadsheetId = searchParams.get('spreadsheetId')
  const sheetName = searchParams.get('sheetName') || 'LEADS'

  if (!spreadsheetId) {
    return NextResponse.json({ error: 'spreadsheetId requerido' }, { status: 400 })
  }

  try {
    const rows = await readSheet(accessToken, spreadsheetId, sheetName)
    return NextResponse.json({ rows })
  } catch (err) {
    return NextResponse.json({ rows: [], error: String(err) }, { status: 200 })
  }
}
