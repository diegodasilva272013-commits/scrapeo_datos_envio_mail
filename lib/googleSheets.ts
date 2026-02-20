import { google } from 'googleapis'

// ─── Crear cliente autenticado ───────────────────────────────────────────────
export function getSheetsClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.sheets({ version: 'v4', auth })
}

export function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  return google.drive({ version: 'v3', auth })
}

// ─── Listar spreadsheets del Drive ──────────────────────────────────────────
export async function listSpreadsheets(accessToken: string) {
  const drive = getDriveClient(accessToken)
  const res = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
    fields: 'files(id, name)',
    pageSize: 50,
  })
  return res.data.files || []
}

// ─── Listar tabs (sheets) de un spreadsheet ─────────────────────────────────
export async function listSheetTabs(accessToken: string, spreadsheetId: string) {
  const sheets = getSheetsClient(accessToken)
  const res = await sheets.spreadsheets.get({ spreadsheetId })
  return res.data.sheets?.map((s) => ({
    id: s.properties?.sheetId,
    name: s.properties?.title,
  })) || []
}

// ─── Leer todas las filas de una tab ────────────────────────────────────────
export async function readSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<Record<string, string>[]> {
  const sheets = getSheetsClient(accessToken)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  })
  const rows = res.data.values || []
  if (rows.length < 2) return []
  const headers = rows[0] as string[]
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = (row[i] as string) || ''
    })
    return obj
  })
}

// ─── Obtener headers de una tab ─────────────────────────────────────────────
export async function getHeaders(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<string[]> {
  const sheets = getSheetsClient(accessToken)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  })
  return (res.data.values?.[0] as string[]) || []
}

// ─── Asegurar que existen columnas (crea si faltan) ─────────────────────────
export async function ensureColumns(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  required: string[]
) {
  const sheets = getSheetsClient(accessToken)
  let headers = await getHeaders(accessToken, spreadsheetId, sheetName)

  if (headers.length === 0) {
    // Sheet vacía: escribir headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [required] },
    })
    return
  }

  const missing = required.filter((col) => !headers.includes(col))
  if (missing.length > 0) {
    const newHeaders = [...headers, ...missing]
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [newHeaders] },
    })
  }
}

// ─── Upsert por columna match (replicando appendOrUpdate de n8n) ─────────────
// matchColumn: columna clave para buscar duplicados (ej: "Web")
// data: objeto { columna: valor }
export async function upsertRow(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  matchColumn: string,
  matchValue: string,
  data: Record<string, string>
) {
  const sheets = getSheetsClient(accessToken)

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  })
  const allRows = res.data.values || []

  if (allRows.length === 0) {
    // Sheet completamente vacía
    const headers = Object.keys(data)
    const values = headers.map((h) => data[h] || '')
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'RAW',
      requestBody: { values: [headers, values] },
    })
    return
  }

  const headers = allRows[0] as string[]
  const matchIdx = headers.indexOf(matchColumn)

  // Buscar fila existente
  let existingRowIdx = -1
  for (let i = 1; i < allRows.length; i++) {
    if ((allRows[i][matchIdx] as string) === matchValue) {
      existingRowIdx = i
      break
    }
  }

  if (existingRowIdx >= 0) {
    // Update: modificar solo las columnas que vienen en data
    const rowNum = existingRowIdx + 1 // 1-indexed
    const updates: { range: string; values: string[][] }[] = []

    for (const [col, val] of Object.entries(data)) {
      let colIdx = headers.indexOf(col)
      if (colIdx < 0) {
        // Columna nueva: agregar al header
        colIdx = headers.length
        headers.push(col)
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!${colToLetter(colIdx)}1`,
          valueInputOption: 'RAW',
          requestBody: { values: [[col]] },
        })
      }
      updates.push({
        range: `${sheetName}!${colToLetter(colIdx)}${rowNum}`,
        values: [[val]],
      })
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates,
      },
    })
  } else {
    // Append: nueva fila
    // Asegurar que las columnas necesarias existen en headers
    for (const col of Object.keys(data)) {
      if (!headers.includes(col)) {
        const colIdx = headers.length
        headers.push(col)
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!${colToLetter(colIdx)}1`,
          valueInputOption: 'RAW',
          requestBody: { values: [[col]] },
        })
      }
    }

    const row = headers.map((h) => data[h] || '')
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: sheetName,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    })
  }
}

// ─── Leer/escribir una celda específica (para CONFIG y PROMPTS) ──────────────
export async function readCell(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<string> {
  const sheets = getSheetsClient(accessToken)
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range })
  return res.data.values?.[0]?.[0] as string || ''
}

export async function writeCell(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  value: string
) {
  const sheets = getSheetsClient(accessToken)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [[value]] },
  })
}

// ─── Leer/escribir tab de clave-valor (CONFIG, PROMPTS, LOGS) ────────────────
export async function readKVTab(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<Record<string, string>> {
  const sheets = getSheetsClient(accessToken)
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName,
    })
    const rows = res.data.values || []
    const kv: Record<string, string> = {}
    rows.forEach((row) => {
      if (row[0]) kv[row[0] as string] = (row[1] as string) || ''
    })
    return kv
  } catch {
    return {}
  }
}

export async function writeKVTab(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  data: Record<string, string>
) {
  const sheets = getSheetsClient(accessToken)

  // Crear tab si no existe
  await ensureTabExists(accessToken, spreadsheetId, sheetName)

  const rows = Object.entries(data).map(([k, v]) => [k, v])
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: sheetName,
  })
  if (rows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: rows },
    })
  }
}

// ─── Appender log a tab LOGS ─────────────────────────────────────────────────
export async function appendLog(
  accessToken: string,
  spreadsheetId: string,
  message: string
) {
  const sheets = getSheetsClient(accessToken)
  await ensureTabExists(accessToken, spreadsheetId, 'LOGS')
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'LOGS',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[new Date().toISOString(), message]],
    },
  })
}

// ─── Asegurar que una tab existe ─────────────────────────────────────────────
export async function ensureTabExists(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
) {
  const sheets = getSheetsClient(accessToken)
  const res = await sheets.spreadsheets.get({ spreadsheetId })
  const exists = res.data.sheets?.some((s) => s.properties?.title === sheetName)
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    })
  }
}

// ─── Crear spreadsheet desde template ────────────────────────────────────────
export async function createSpreadsheet(accessToken: string, title: string) {
  const sheets = getSheetsClient(accessToken)
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [
        { properties: { title: 'LEADS' } },
        { properties: { title: 'CONFIG' } },
        { properties: { title: 'PROMPTS' } },
        { properties: { title: 'LOGS' } },
      ],
    },
  })

  const spreadsheetId = res.data.spreadsheetId!

  // Escribir headers en LEADS
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'LEADS!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [['Web', 'Correo', 'Correo Icebreaker', 'Estado', 'Fecha Scrapeo', 'Fecha Envío', 'Ultimo Error']],
    },
  })

  return { spreadsheetId, url: res.data.spreadsheetUrl }
}

// ─── Helper: número de columna a letra ───────────────────────────────────────
export function colToLetter(idx: number): string {
  let letter = ''
  let n = idx
  while (n >= 0) {
    letter = String.fromCharCode(65 + (n % 26)) + letter
    n = Math.floor(n / 26) - 1
  }
  return letter
}
