import { NextRequest, NextResponse } from 'next/server'
import { listSpreadsheets, listSheetTabs, createSpreadsheet } from '@/lib/googleSheets'

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const spreadsheetId = searchParams.get('spreadsheetId')

    if (spreadsheetId) {
      const tabs = await listSheetTabs(accessToken, spreadsheetId)
      return NextResponse.json({ tabs })
    }

    const files = await listSpreadsheets(accessToken)
    return NextResponse.json({ files })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error', files: [], tabs: [] }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()
    const { title = 'LeadFlow - Control de Leads' } = body

    const result = await createSpreadsheet(accessToken, title)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error' }, { status: 200 })
  }
}
