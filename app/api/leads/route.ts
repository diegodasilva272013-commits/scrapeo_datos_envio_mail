import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readSheet } from '@/lib/googleSheets'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const spreadsheetId = searchParams.get('spreadsheetId')
  const sheetName = searchParams.get('sheetName') || 'LEADS'

  if (!spreadsheetId) {
    return NextResponse.json({ error: 'spreadsheetId requerido' }, { status: 400 })
  }

  try {
    const rows = await readSheet(session.accessToken, spreadsheetId, sheetName)
    return NextResponse.json({ rows })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
