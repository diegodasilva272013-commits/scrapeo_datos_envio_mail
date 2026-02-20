/**
 * WORKFLOW A — Scrapeo → Google Sheets
 *
 * Replica exactamente el flujo del JSON "Agente Scrapeo Mail.json":
 * OpenAI → parseNicheAndCity → Places API → Split → Loop:
 *   [filterBadUrls → deduplicateURLs → wait(1s) → fetchPage → wait(0.5s)
 *    → extractEmails → isValidEmail → deduplicateEmails → upsertSheet]
 */

import axios from 'axios'
import { generateNicheQuery } from '../openai'
import { upsertRow, readKVTab, ensureTabExists } from '../googleSheets'
import { normalizeWebUrl, filterBadUrls, deduplicateByField } from '../utils/urlUtils'
import { extractEmails, isValidEmail, deduplicateEmails } from '../utils/emailUtils'
import { parseNicheAndCity } from '../utils/nicheParser'
import { sleep } from '../utils/sleep'

export interface WorkflowAConfig {
  accessToken: string
  spreadsheetId: string
  sheetName: string         // tab LEADS
  niche?: string            // override manual (si viene de UI)
  city?: string             // override manual
  promptA?: string          // prompt editable
  onLog?: (msg: string) => void
}

export async function runWorkflowA(config: WorkflowAConfig) {
  const {
    accessToken,
    spreadsheetId,
    sheetName,
    onLog = () => {},
  } = config

  // ── Leer prompts y config de la Sheet ──────────────────────────────────────
  const kvPrompts = await readKVTab(accessToken, spreadsheetId, 'PROMPTS')
  const kvConfig = await readKVTab(accessToken, spreadsheetId, 'CONFIG')

  const promptA = config.promptA || kvPrompts['PROMPT_A'] || DEFAULT_PROMPT_A(kvConfig)

  // ── Asegurar que la tab LEADS tiene las columnas necesarias ────────────────
  await ensureTabExists(accessToken, spreadsheetId, sheetName)

  // ── Paso 1: OpenAI genera la frase (o usamos niche/city directo) ───────────
  let niche = config.niche || kvConfig['niche'] || ''
  let city = config.city || kvConfig['city'] || ''

  if (!niche || !city) {
    onLog('🤖 OpenAI: generando frase de búsqueda...')
    const aiText = await generateNicheQuery(promptA)
    onLog(`📝 Frase generada: ${aiText}`)

    // Paso 2: Mapeo de texto (nodo "Mapeo de texto" → "Diferenciar nicho de ciudad")
    const parsed = parseNicheAndCity(aiText)
    if ('error' in parsed) {
      onLog(`❌ ${parsed.error}`)
      return { success: false, error: parsed.error }
    }
    niche = parsed.niche
    city = parsed.city
  }

  onLog(`🔍 Buscando: "${niche}" en "${city}"`)

  // ── Paso 3: Google Places API (nodo "Scrapeo Google Maps1") ─────────────────
  const placesApiKey = process.env.GOOGLE_PLACES_API_KEY!
  let places: { websiteUri: string }[] = []

  try {
    const placesRes = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      { textQuery: `${niche} en ${city}` },
      {
        headers: {
          'X-Goog-Api-Key': placesApiKey,
          'X-Goog-FieldMask': 'places.websiteUri',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
        maxRedirects: 2,
      }
    )
    // Paso 4: Split Out (body.places)
    places = (placesRes.data?.places || []) as { websiteUri: string }[]
    onLog(`📍 Google Maps: ${places.length} resultados`)
  } catch (err) {
    onLog(`⚠️ Error en Places API: ${String(err)}`)
    return { success: false, error: 'Places API error' }
  }

  // ── Paso 5: Loop Over Items ──────────────────────────────────────────────────
  let totalUpserted = 0

  for (const place of places) {
    if (!place.websiteUri) continue

    // Nodo "Limpiamos web"
    const cleanedUrl = normalizeWebUrl(place.websiteUri)
    place.websiteUri = cleanedUrl
  }

  // Nodo "Deduplicar URLs"
  const uniquePlaces = deduplicateByField(places, 'websiteUri')

  // Nodo "Filter" (11 condiciones)
  const filteredPlaces = filterBadUrls(uniquePlaces)

  onLog(`🌐 URLs después de filtros: ${filteredPlaces.length}`)

  for (const place of filteredPlaces) {
    const url = place.websiteUri
    onLog(`  → Procesando: ${url}`)

    // Nodo "Wait1" (1 seg)
    await sleep(1000)

    // Nodo "Scrapeo de páginas" (HTTP GET, timeout 10s, retry 2)
    let html = ''
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const pageRes = await axios.get(url, {
          timeout: 10000,
          maxRedirects: 3,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          },
          validateStatus: () => true,
        })
        html = typeof pageRes.data === 'string' ? pageRes.data : JSON.stringify(pageRes.data)
        break
      } catch {
        if (attempt === 0) await sleep(1000)
      }
    }

    // Nodo "Wait" (0.5 seg)
    await sleep(500)

    // Nodo "Extraer emails"
    const emailsRaw = extractEmails(html)

    // Nodo "If" + "Borrar duplicados1"
    const validEmails = deduplicateEmails(emailsRaw.filter((e) => isValidEmail(e.email)))

    if (validEmails.length === 0) {
      onLog(`    ⚠️  Sin emails válidos`)
      continue
    }

    // Nodo "Google Sheets" (appendOrUpdate match por Web)
    // Se escribe UN registro por web (el primer email válido)
    const email = validEmails[0].email
    const now = new Date().toISOString()

    await upsertRow(accessToken, spreadsheetId, sheetName, 'Web', url, {
      Web: url,
      Correo: email,
      Estado: 'Sin enviar',
      'Fecha Scrapeo': now,
    })

    totalUpserted++
    onLog(`    ✅ ${email} → ${url}`)
  }

  onLog(`\n✅ Workflow A finalizado. ${totalUpserted} leads escritos/actualizados.`)
  return { success: true, totalUpserted }
}

// ─── Prompt A por defecto (igual al nodo OpenAI del JSON) ────────────────────
function DEFAULT_PROMPT_A(config: Record<string, string>): string {
  const country = config['country'] || 'Argentina'
  const region = config['region'] || ''
  const city = config['city'] || ''
  const niche = config['niche'] || ''

  if (niche && city) {
    return `Genera UNA frase corta: "Búscame ${niche} en ${city}"\n\nReglas:\n- Solo UNA frase\n- Sin explicaciones`
  }

  return `Genera UNA frase corta: "Búscame [negocio] en [${country}]"\n\nNegocios: médicos, abogados, clínicas dentales, asesorías, clínicas de belleza, fisioterapeutas, masajistas, osteópatas\n\nProvincias: cualquiera de ${country}${region ? ` (${region})` : ''}\n\nReglas:\n- Solo UNA frase\n- Varía negocio y provincia\n- Sin explicaciones\n\nEjemplo: "Búscame dentistas en Córdoba."`
}
