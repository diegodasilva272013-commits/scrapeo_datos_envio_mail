import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readKVTab, writeKVTab } from '@/lib/googleSheets'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const spreadsheetId = searchParams.get('spreadsheetId')
  if (!spreadsheetId) return NextResponse.json({ error: 'spreadsheetId requerido' }, { status: 400 })

  const prompts = await readKVTab(session.accessToken, spreadsheetId, 'PROMPTS')
  return NextResponse.json({ prompts })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { spreadsheetId, prompts } = body
  if (!spreadsheetId) return NextResponse.json({ error: 'spreadsheetId requerido' }, { status: 400 })

  await writeKVTab(session.accessToken, spreadsheetId, 'PROMPTS', prompts)
  return NextResponse.json({ success: true })
}
