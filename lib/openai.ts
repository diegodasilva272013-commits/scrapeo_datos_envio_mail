import OpenAI from 'openai'

let _client: OpenAI | null = null

function getClient() {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

// ─── Workflow A: Generar frase "Búscame X en Y" ───────────────────────────────
// Usa el prompt A configurable desde la UI (guardado en PROMPTS tab)
export async function generateNicheQuery(promptA: string): Promise<string> {
  const client = getClient()
  const res = await client.chat.completions.create({
    model: 'gpt-4.1',
    messages: [{ role: 'user', content: promptA }],
  })
  return res.choices[0]?.message?.content || ''
}

// ─── Workflow B: Generar email icebreaker ─────────────────────────────────────
// Usa el prompt B configurable desde la UI (guardado en PROMPTS tab)
export async function generateIcebreakerEmail(
  systemPromptB: string,
  cleanText: string,
  colorPrimario: string,
  colorSecundario: string
): Promise<{ ASUNTO: string; HTML: string }> {
  const client = getClient()

  const userContent = `### DATOS DEL PROSPECTO

**Información de su negocio (extraída de su web):**
${cleanText}

**Colores de su marca (SOLO para diseño del email):**
- Primario: ${colorPrimario}
- Secundario: ${colorSecundario}`

  const res = await client.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      { role: 'system', content: systemPromptB },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
  })

  const raw = res.choices[0]?.message?.content || '{}'
  try {
    return JSON.parse(raw) as { ASUNTO: string; HTML: string }
  } catch {
    return { ASUNTO: 'Sin asunto', HTML: '<p>Error generando email</p>' }
  }
}
