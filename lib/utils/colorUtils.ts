// ─── Replicación EXACTA del nodo "Limpiar codigo + colores1" (Workflow B) ────

export interface CleanResult {
  cleanText: string
  coloresPrincipales: string[]
  colorPrimario: string
  colorSecundario: string
  colorAccento: string
  correo: string
  web: string
  error?: string
}

export function cleanHtmlAndExtractColors(
  html: string,
  correo = '',
  web = ''
): CleanResult {
  if (!html || html.trim() === '' || html === '{}' || html === 'undefined') {
    return {
      cleanText: '',
      coloresPrincipales: [],
      colorPrimario: '#2563eb',
      colorSecundario: '#1e40af',
      colorAccento: '#3b82f6',
      error: 'No se pudo obtener el HTML de la web',
      correo,
      web,
    }
  }

  // === LIMPIEZA DEL TEXTO VISIBLE === (idéntica al JSON)
  const cleanText = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000)

  // === EXTRACCIÓN DE COLORES === (idéntica al JSON)
  const coloresEncontrados = new Set<string>()

  // 1. Colores HEX
  const hexMatches = html.match(/#([0-9a-fA-F]{3}){1,2}\b/g) || []
  hexMatches.forEach((color) => coloresEncontrados.add(color.toLowerCase()))

  // 2. Colores RGB/RGBA
  const rgbMatches = html.match(/rgba?\s*\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+)?\s*\)/gi) || []
  rgbMatches.forEach((rgb) => {
    const match = rgb.match(/(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/)
    if (match) {
      const hex = '#' + [match[1], match[2], match[3]]
        .map((x) => parseInt(x).toString(16).padStart(2, '0'))
        .join('')
      coloresEncontrados.add(hex.toLowerCase())
    }
  })

  // 3. Colores de CSS inline
  const styleMatches = html.match(/(?:background-color|color|border-color)\s*:\s*([^;"']+)/gi) || []
  styleMatches.forEach((styleMatch) => {
    const colorValue = styleMatch.split(':')[1]?.trim() || ''
    if (colorValue.startsWith('#')) {
      coloresEncontrados.add(colorValue.toLowerCase())
    } else if (colorValue.startsWith('rgb')) {
      const rgbMatch = colorValue.match(/(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/)
      if (rgbMatch) {
        const hex = '#' + [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
          .map((x) => parseInt(x).toString(16).padStart(2, '0'))
          .join('')
        coloresEncontrados.add(hex.toLowerCase())
      }
    }
  })

  // Filtrar colores muy claros/oscuros (idéntico al JSON)
  const coloresUtiles = Array.from(coloresEncontrados).filter((color) => {
    if (!color.startsWith('#') || color.length < 4) return false
    let hex = color.slice(1)
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 30 && brightness < 240
  })

  const coloresPrincipales = coloresUtiles.slice(0, 5)
  const colorPrimario = coloresPrincipales[0] || '#2563eb'
  const colorSecundario = coloresPrincipales[1] || '#1e40af'
  const colorAccento = coloresPrincipales[2] || '#3b82f6'

  return {
    cleanText,
    coloresPrincipales,
    colorPrimario,
    colorSecundario,
    colorAccento,
    correo,
    web,
  }
}
