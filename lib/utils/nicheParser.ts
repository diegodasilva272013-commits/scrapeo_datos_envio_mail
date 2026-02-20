// ─── Replicación EXACTA del nodo "Diferenciar nicho de ciudad" ───────────────

const normalize = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export function parseNicheAndCity(
  text: string
): { niche: string; city: string; original: string } | { error: string; original: string } {
  const originalText = text || ''
  const normalizedText = normalize(originalText)

  const regex = /\b(?:busc(a|ame|qu?ame)|quiero|necesito|hay)\s+(.*?)\s+en\s+(.+?)([.,\s]|$)/i
  const match = normalizedText.match(regex)

  if (match && match[2] && match[3]) {
    const niche = match[2].trim()
    const city = match[3].trim()
    return { niche, city, original: originalText }
  } else {
    return {
      error: '❌ No se pudo extraer el nicho y la ciudad.',
      original: originalText,
    }
  }
}
