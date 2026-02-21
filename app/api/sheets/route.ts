import { NextRequest, NextResponse } from 'next/server'
import { listSpreadsheets, listSheetTabs, createSpreadsheet } from '@/lib/googleSheets'

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const spreadsheetId = searchParams.get('spreadsheetId')

  if (spreadsheetId) {
    // Listar tabs de un spreadsheet específico
    const tabs = await listSheetTabs(accessToken, spreadsheetId)
    return NextResponse.json({ tabs })
  }

  // Listar todos los spreadsheets del Drive
  const files = await listSpreadsheets(accessToken)
  return NextResponse.json({ files })
}

export async function POST(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { title = 'LeadFlow - Control de Leads' } = body

  const result = await createSpreadsheet(accessToken, title)
  return NextResponse.json(result)
}
