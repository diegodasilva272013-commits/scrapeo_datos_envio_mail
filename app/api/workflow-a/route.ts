import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runWorkflowA } from '@/lib/workflows/workflowA'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await req.json()
  const { spreadsheetId, sheetName = 'LEADS', niche, city } = body

  if (!spreadsheetId) {
    return NextResponse.json({ error: 'spreadsheetId requerido' }, { status: 400 })
  }

  const logs: string[] = []

  try {
    const result = await runWorkflowA({
      accessToken: session.accessToken,
      spreadsheetId,
      sheetName,
      niche,
      city,
      onLog: (msg) => {
        console.log('[WF-A]', msg)
        logs.push(msg)
      },
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
