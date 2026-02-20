// ─── Replicación EXACTA del nodo "Extraer emails" (Workflow A) ───────────────

// Prefijos genéricos a excluir (ampliado) — copiado literalmente del JSON
const FILTROS_BLOQUEO = [
  'info', 'contact', 'admin', 'support', 'noreply', 'no-reply',
  'ventas', 'marketing', 'hello', 'service', 'help', 'mail',
  'email', 'contacto', 'reservas', 'hola', 'webmaster', 'root',
  'postmaster', 'hostmaster', 'abuse', 'newsletter', 'suscribe',
]

// Dominios técnicos/falsos a excluir — copiado literalmente del JSON
const DOMINIOS_BLOQUEO = [
  'example.com', 'test.com', 'domain.com', 'email.com',
  'sentry.io', 'wixpress.com', 'mailchimp.com', 'sendgrid.net',
]

// Extensiones de archivo (falsos positivos) — copiado literalmente del JSON
const EXTENSIONES_BLOQUEO = ['.jpg', '.png', '.gif', '.webp', '.svg', '.css', '.js']

export function extractEmails(html: string): { email: string }[] {
  const input = (html || '').toString()

  // Regex idéntica al JSON
  const regex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
  const matches = input.match(regex) || []

  const emails = matches.filter((email) => {
    const lower = email.toLowerCase()
    const user = lower.split('@')[0]
    const domain = lower.split('@')[1]

    if (FILTROS_BLOQUEO.some((b) => user.includes(b))) return false
    if (DOMINIOS_BLOQUEO.some((d) => domain.includes(d))) return false
    if (EXTENSIONES_BLOQUEO.some((ext) => lower.includes(ext))) return false
    if (/[._-]{2,}/.test(user)) return false

    return true
  })

  const uniqueEmails = [...new Set(emails)]

  if (uniqueEmails.length === 0) {
    return [{ email: '' }]
  }

  return uniqueEmails.map((email) => ({ email: email.toLowerCase() }))
}

// ─── Replicación exacta del nodo "If" ────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  if (!email || email.trim() === '') return false
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return regex.test(email)
}

// ─── Replicación exacta del nodo "Borrar duplicados1" ────────────────────────
export function deduplicateEmails(items: { email: string }[]): { email: string }[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (!item.email) return false
    if (seen.has(item.email)) return false
    seen.add(item.email)
    return true
  })
}
