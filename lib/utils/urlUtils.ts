// ─── Replicación exacta del nodo "Limpiamos web" ────────────────────────────
// Limpia URLs removiendo www. y normalizando
export function normalizeWebUrl(original: string): string {
  return original.replace(/^https?:\/\/(www\.)?/i, 'https://')
}

// ─── Replicación exacta del nodo "Code" (Workflow B) ─────────────────────────
// Normalizar URL para scrapeo: https, sin www, con /
export function normalizeLeadUrl(url: string): { cleanUrl: string; originalUrl: string } | { error: string; original: string } {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { error: 'URL no válida', original: url }
  }

  url = url.trim()

  if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url
  }

  url = url.replace(/^http:\/\//i, 'https://')
  url = url.replace(/^(https:\/\/)www\./i, '$1')

  if (!url.endsWith('/')) {
    url += '/'
  }

  return { cleanUrl: url, originalUrl: url }
}

// ─── Replicación exacta del nodo "Filter" (Workflow A) ───────────────────────
// Todas las 11 condiciones notContains del JSON
const BAD_URL_PATTERNS = [
  'schema',
  'google',
  'gstatic',
  'whatsapp',
  'wa.link',
  'facebook',
  'wa.me',
  'instagram',
  'twitter',
  'linkedin',
  'youtube',
]

export function filterBadUrls(items: { websiteUri: string }[]): { websiteUri: string }[] {
  return items.filter((item) => {
    const url = (item.websiteUri || '').toLowerCase()
    return BAD_URL_PATTERNS.every((pattern) => !url.includes(pattern))
  })
}

// ─── Replicación exacta del nodo "Deduplicar URLs" ───────────────────────────
export function deduplicateByField<T extends Record<string, unknown>>(
  items: T[],
  field: string
): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const val = String(item[field] || '')
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}
