import { NextRequest, NextResponse } from 'next/server'
import { runWorkflowA } from '@/lib/workflows/workflowA'
import { getCredenciales } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!accessToken) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const sbToken = req.headers.get('x-sb-token') || ''
  const creds = sbToken ? await getCredenciales(sbToken).catch(() => null) : null

  const body = await req.json()
  const { spreadsheetId, sheetName = 'LEADS', niche, city } = body
  if (!spreadsheetId) return NextResponse.json({ error: 'spreadsheetId requerido' }, { status: 400 })

  const logs: string[] = []
  try {
    const result = await runWorkflowA({
      accessToken,
      spreadsheetId,
      sheetName,
      niche,
      city,
      openaiApiKey: creds?.openai_api_key,
      placesApiKey: creds?.places_api_key,
      onLog: (msg) => { console.log('[WF-A]', msg); logs.push(msg) },
    })

    return NextResponse.json({ ...result, logs })
  } catch (err) {
    console.error('[WF-A] Error:', err)
    return NextResponse.json(
      { error: String(err), logs },
      { status: 500 }
    )
  }
}
