/**
 * WORKFLOW B — Google Sheets → OpenAI → Gmail → Sheets
 *
 * Replica exactamente el flujo del JSON "Agente Icebreaker - envio mail.json":
 * Sheets(read) → filterPending → limit(emailsPerDay) → Loop:
 *   [normalizeUrl → scrapeWeb → mapeo → cleanHtml+colores
 *    → OpenAI(json) → Gmail.send → Sheets(upsert Enviado)]
 */

import axios from 'axios'
import { readSheet, upsertRow, readKVTab, appendLog } from '../googleSheets'
import { generateIcebreakerEmail } from '../openai'
import { sendEmail } from '../gmail'
import { normalizeLeadUrl } from '../utils/urlUtils'
import { cleanHtmlAndExtractColors } from '../utils/colorUtils'
import { sleep } from '../utils/sleep'

export interface WorkflowBConfig {
  accessToken: string
  spreadsheetId: string
  sheetName: string
  emailsPerDay?: number
  openaiApiKey?: string
  onLog?: (msg: string) => void
}

export async function runWorkflowB(config: WorkflowBConfig) {
  const {
    accessToken,
    spreadsheetId,
    sheetName,
    emailsPerDay = 10,
    onLog = () => {},
  } = config

  // ── Leer prompts y config ─────────────────────────────────────────────────
  const kvPrompts = await readKVTab(accessToken, spreadsheetId, 'PROMPTS')
  const kvConfig = await readKVTab(accessToken, spreadsheetId, 'CONFIG')

  const promptB = kvPrompts['PROMPT_B'] || DEFAULT_PROMPT_B(kvConfig)

  // ── Paso 1: Leer Sheet (nodo "Google Sheets2") ────────────────────────────
  const allRows = await readSheet(accessToken, spreadsheetId, sheetName)
  onLog(`📋 Total filas en Sheet: ${allRows.length}`)

  // ── Paso 2: Filter Pendientes (Estado == "Sin enviar") ────────────────────
  const pending = allRows.filter((row) => row['Estado'] === 'Sin enviar')
  onLog(`📌 Pendientes: ${pending.length}`)

  if (pending.length === 0) {
    onLog('ℹ️  No hay leads pendientes de envío.')
    return { success: true, sent: 0 }
  }

  // ── Paso 3: Limit (maxItems: emailsPerDay) ────────────────────────────────
  const batch = pending.slice(0, emailsPerDay)
  onLog(`📦 Procesando ${batch.length} de ${pending.length} pendientes`)

  let sent = 0

  // ── Paso 4: Loop Over Items ────────────────────────────────────────────────
  for (const row of batch) {
    const webOriginal = row['Web'] || ''
    const correo = row['Correo'] || ''

    if (!correo || !webOriginal) {
      onLog(`  ⚠️  Fila sin correo o web, saltando`)
      continue
    }

    onLog(`  → Enviando a: ${correo} | ${webOriginal}`)

    // Nodo "Code" (normalizar URL)
    const normalized = normalizeLeadUrl(webOriginal)
    if ('error' in normalized) {
      onLog(`    ❌ URL inválida: ${normalized.error}`)
      continue
    }
    const cleanUrl = normalized.cleanUrl

    // Nodo "Scrape Company URLs1" (HTTP GET, timeout 15s, retry 2)
    let html = ''
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await axios.get(cleanUrl, {
          timeout: 15000,
          maxRedirects: 3,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          },
          validateStatus: () => true,
        })
        html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
        break
      } catch {
        if (attempt === 0) await sleep(2000)
      }
    }

    // Nodo "Mapeo correo - web1" (Set: correo, web, htmlContent)
    // (ya lo tenemos: correo, webOriginal, html)

    // Nodo "Limpiar codigo + colores1"
    const cleaned = cleanHtmlAndExtractColors(html, correo, webOriginal)

    // Nodo "Agente creador de Email IceBreaker1" (OpenAI, jsonOutput)
    let emailResult: { ASUNTO: string; HTML: string }
    try {
      emailResult = await generateIcebreakerEmail(
        promptB,
        cleaned.cleanText,
        cleaned.colorPrimario,
        cleaned.colorSecundario,
        config.openaiApiKey
      )
    } catch (err) {
      onLog(`    ❌ Error OpenAI: ${String(err)}`)

      // Registrar error en sheet
      await upsertRow(accessToken, spreadsheetId, sheetName, 'Web', webOriginal, {
        Web: webOriginal,
        'Ultimo Error': `OpenAI error: ${String(err)}`,
      })
      continue
    }

    // Nodo "Gmail1" (send)
    try {
      await sendEmail(accessToken, correo, emailResult.ASUNTO, emailResult.HTML)
    } catch (err) {
      onLog(`    ❌ Error Gmail: ${String(err)}`)

      await upsertRow(accessToken, spreadsheetId, sheetName, 'Web', webOriginal, {
        Web: webOriginal,
        'Ultimo Error': `Gmail error: ${String(err)}`,
      })
      continue
    }

    // Nodo "Google Sheets1" (appendOrUpdate, Estado="Enviado", match por Web)
    const now = new Date().toISOString()
    await upsertRow(accessToken, spreadsheetId, sheetName, 'Web', webOriginal, {
      Web: webOriginal,
      'Correo Icebreaker': emailResult.ASUNTO,
      Estado: 'Enviado',
      'Fecha Envío': now,
    })

    sent++
    onLog(`    ✅ Email enviado: "${emailResult.ASUNTO}"`)

    // Pequeña pausa entre emails
    await sleep(1000)
  }

  // Log en Sheet LOGS
  await appendLog(
    accessToken,
    spreadsheetId,
    `Workflow B: ${sent} emails enviados de ${batch.length} intentados`
  ).catch(() => {})

  onLog(`\n✅ Workflow B finalizado. ${sent}/${batch.length} emails enviados.`)
  return { success: true, sent }
}

// ─── Prompt B por defecto (exactamente el system prompt del JSON) ─────────────
function DEFAULT_PROMPT_B(config: Record<string, string>): string {
  const companyName = config['companyName'] || 'Divisual Project'
  const companyLink = config['companyLink'] || '#'
  const senderName = config['senderName'] || 'Diego Da Silva'
  const senderRole = config['senderRole'] || 'CEO'
  const ctaEmail = config['senderEmail'] || 'hola@tuempresa.com'
  const saludo = config['saludo'] || 'Un saludo'

  return `Eres un experto en copywriting B2B especializado en venta de servicios de **Inteligencia Artificial y Automatización de procesos**.

## QUÉ VENDEMOS
Somos **${companyName}**, una empresa que ayuda a negocios a:
- Automatizar tareas repetitivas (emails, seguimientos, reportes)
- Implementar chatbots y asistentes con IA
- Crear flujos de trabajo inteligentes que ahorran horas de trabajo manual
- Integrar sistemas para que todo funcione sin intervención humana

## TU TAREA
Escribe un email de prospeción en frío que:
1. **Demuestre que investigaste su negocio** - Menciona algo ESPECÍFICO que viste en su web (un servicio, su sector, algo que hacen)
2. **Conecte con un problema real** - Identifica una tarea repetitiva o manual que probablemente tienen
3. **Presente la solución de forma natural** - Cómo la IA/automatización podría ayudarles
4. **Termine con una pregunta simple** - Que invite a responder sí o no

## TONO
- Tutea siempre
- Directo y humano, nada corporativo
- Como si hablaras con un conocido profesional
- Sin frases de relleno ("Espero que estés bien", "Me permito escribirte")
- Seguro pero no arrogante

## ESTRUCTURA (MÁX 100 palabras)
1. **Gancho** - Observación específica sobre SU negocio
2. **Problema** - Una frustración que probablemente tienen (tareas manuales, falta de tiempo, seguimientos que se pierden)
3. **Solución** - Cómo ayudamos a negocios similares con IA/automatización
4. **CTA** - Pregunta directa tipo: "¿Te interesaría ver cómo funcionaría en tu caso?"

## DISEÑO DEL EMAIL (HTML)
Usa los colores de SU marca SOLO para:
- Botón CTA: fondo con su color primario
- Link de firma: su color primario
- El resto: fondo blanco, texto gris oscuro (#374151)

El botón debe redirigir a: mailto:${ctaEmail}?subject=Re:%20[ASUNTO]

## FIRMA
${saludo},
${senderName}
${senderRole} de [${companyName}](${companyLink})

## FORMATO DE SALIDA (JSON)
\`\`\`json
{
  "ASUNTO": "[Asunto corto y directo - max 50 caracteres]",
  "HTML": "[Email completo en HTML con estilos inline]"
}
\`\`\`

## PROHIBIDO
- Hablar de colores o diseño web
- Emails genéricos que sirvan para cualquiera
- Más de 120 palabras
- Vender agresivamente
- Mentir o exagerar`
}
