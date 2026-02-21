'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SinAcceso from '@/components/SinAcceso'
import { usuarioActivo } from '@/lib/supabase'

const DEFAULT_PROMPT_A = `Genera UNA frase corta: "Búscame [negocio] en [Argentina]"

Negocios: médicos, abogados, clínicas dentales, asesorías, clínicas de belleza, fisioterapeutas, masajistas, osteópatas

Provincias: cualquiera de Argentina (Buenos Aires, Catamarca, Chaco, Chubut, Ciudad Autónoma de Buenos Aires, Córdoba, Corrientes, Entre Ríos, Formosa, Jujuy, La Pampa, La Rioja, Mendoza, Misiones, Neuquén, Río Negro, Salta, San Juan, San Luis, Santa Cruz, Santa Fe, Santiago del Estero, Tierra del Fuego, Tucumán etc.)

Reglas:
- Solo UNA frase
- Varía negocio y provincia
- Sin explicaciones

Ejemplo: "Búscame dentistas en Córdoba."`

const DEFAULT_PROMPT_B = `Eres un experto en copywriting B2B especializado en venta de servicios de Inteligencia Artificial y Automatización de procesos.

## QUÉ VENDEMOS
Somos [NOMBRE EMPRESA], una empresa que ayuda a negocios a:
- Automatizar tareas repetitivas (emails, seguimientos, reportes)
- Implementar chatbots y asistentes con IA
- Crear flujos de trabajo inteligentes que ahorran horas de trabajo manual
- Integrar sistemas para que todo funcione sin intervención humana

## TU TAREA
Escribe un email de prospección en frío que:
1. Demuestre que investigaste su negocio - Menciona algo ESPECÍFICO que viste en su web
2. Conecte con un problema real - Identifica una tarea repetitiva o manual que probablemente tienen
3. Presente la solución de forma natural - Cómo la IA/automatización podría ayudarles
4. Termine con una pregunta simple - Que invite a responder sí o no

## TONO
- Tutea siempre
- Directo y humano, nada corporativo
- Sin frases de relleno ("Espero que estés bien")
- Seguro pero no arrogante

## ESTRUCTURA (MÁX 100 palabras)
1. Gancho - Observación específica sobre SU negocio
2. Problema - Una frustración que probablemente tienen
3. Solución - Cómo ayudamos a negocios similares
4. CTA - Pregunta directa

## FORMATO DE SALIDA (JSON)
{
  "ASUNTO": "[Asunto corto y directo - max 50 caracteres]",
  "HTML": "[Email completo en HTML con estilos inline]"
}

## PROHIBIDO
- Emails genéricos que sirvan para cualquiera
- Más de 120 palabras
- Vender agresivamente`

export default function PromptsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tieneAcceso, setTieneAcceso] = useState<boolean | null>(null)

  useEffect(() => {
    if (!session?.user?.email) return
    usuarioActivo(session.user.email).then(setTieneAcceso)
  }, [session])

  if (status === 'loading' || tieneAcceso === null) return null
  if (!tieneAcceso) return <SinAcceso />

  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [sheets, setSheets] = useState<{ id: string; name: string }[]>([])
  const [promptA, setPromptA] = useState(DEFAULT_PROMPT_A)
  const [promptB, setPromptB] = useState(DEFAULT_PROMPT_B)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Auth bypass para testing
  // useEffect(() => {
  //   if (status === 'unauthenticated') router.push('/login')
  // }, [status, router])

  useEffect(() => {
    if (!session) return
    fetch('/api/sheets')
      .then((r) => r.json())
      .then((d) => setSheets(d.files || []))
  }, [session])

  useEffect(() => {
    if (!spreadsheetId) return
    fetch(`/api/prompts?spreadsheetId=${spreadsheetId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.prompts?.PROMPT_A) setPromptA(d.prompts.PROMPT_A)
        if (d.prompts?.PROMPT_B) setPromptB(d.prompts.PROMPT_B)
      })
  }, [spreadsheetId])

  const save = async () => {
    if (!spreadsheetId) return alert('Seleccioná una spreadsheet primero')
    setSaving(true)
    await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId,
        prompts: { PROMPT_A: promptA, PROMPT_B: promptB },
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 animate-slide-up">
            <h1 className="font-display text-3xl font-bold text-text">Prompts IA</h1>
            <p className="text-text-dim font-body mt-1">
              Los prompts se guardan en la pestaña PROMPTS de tu Sheet y se usan en cada ejecución
            </p>
          </div>

          {/* Sheet */}
          <div className="card mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <label className="label">Spreadsheet activa</label>
            <select className="input" value={spreadsheetId} onChange={(e) => setSpreadsheetId(e.target.value)}>
              <option value="">— Elegí una sheet —</option>
              {sheets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Prompt A */}
          <div className="card mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="px-2 py-1 bg-accent/15 border border-accent/30 rounded-lg">
                <span className="text-accent font-mono text-xs font-bold">Workflow A</span>
              </div>
              <h2 className="font-display text-base font-semibold text-text">Prompt de Scrapeo</h2>
            </div>
            <p className="text-text-dim text-xs font-body mb-3">
              Este prompt le dice a GPT-4.1 que genere una frase tipo "Búscame X en Y" para buscar en Google Maps.
              Si configuraste nicho y ciudad en Config, OpenAI no se usa para esto.
            </p>
            <textarea
              className="input font-mono text-xs h-64 resize-y"
              value={promptA}
              onChange={(e) => setPromptA(e.target.value)}
            />
          </div>

          {/* Prompt B */}
          <div className="card mb-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="px-2 py-1 bg-success/15 border border-success/30 rounded-lg">
                <span className="text-success font-mono text-xs font-bold">Workflow B</span>
              </div>
              <h2 className="font-display text-base font-semibold text-text">Prompt Icebreaker</h2>
            </div>
            <p className="text-text-dim text-xs font-body mb-3">
              Este es el system prompt que recibe GPT-4.1 para crear el email personalizado. 
              El modelo recibe además el texto de la web del prospecto y sus colores de marca.
              Debe retornar siempre JSON con {`{ASUNTO, HTML}`}.
            </p>
            <textarea
              className="input font-mono text-xs h-80 resize-y"
              value={promptB}
              onChange={(e) => setPromptB(e.target.value)}
            />
          </div>

          {/* Guardar */}
          <div className="flex justify-end animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button onClick={save} disabled={saving || !spreadsheetId} className="btn-primary px-8">
              {saving ? '⏳ Guardando...' : saved ? '✅ Guardado!' : '💾 Guardar prompts'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
