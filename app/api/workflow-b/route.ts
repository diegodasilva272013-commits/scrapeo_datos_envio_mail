import { NextRequest, NextResponse } from 'next/server'
import { runWorkflowB } from '@/lib/workflows/workflowB'

export async function POST(req: NextRequest) {
  const accessToken = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!accessToken) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { spreadsheetId, sheetName = 'LEADS', emailsPerDay = 10 } = body

  if (!spreadsheetId) {
    return NextResponse.json({ error: 'spreadsheetId requerido' }, { status: 400 })
  }

  const logs: string[] = []

  try {
    const result = await runWorkflowB({
      accessToken: accessToken,
      spreadsheetId,
      sheetName,
      emailsPerDay: Number(emailsPerDay),
      onLog: (msg) => {
        console.log('[WF-B]', msg)
        logs.push(msg)
      },
    })

    return NextResponse.json({ ...result, logs })
  } catch (err) {
    console.error('[WF-B] Error:', err)
    return NextResponse.json(
      { error: String(err), logs },
      { status: 500 }
    )
  }
}
