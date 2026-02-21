import { NextRequest, NextResponse } from 'next/server'
import { readKVTab, writeKVTab } from '@/lib/googleSheets'

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const spreadsheetId = searchParams.get('spreadsheetId')
  if (!spreadsheetId) return NextResponse.json({ error: 'spreadsheetId requerido' }, { status: 400 })

  const prompts = await readKVTab(accessToken, spreadsheetId, 'PROMPTS')
  return NextResponse.json({ prompts })
}

export async function POST(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { spreadsheetId, prompts } = body
  if (!spreadsheetId) return NextResponse.json({ error: 'spreadsheetId requerido' }, { status: 400 })

  await writeKVTab(accessToken, spreadsheetId, 'PROMPTS', prompts)
  return NextResponse.json({ success: true })
}
