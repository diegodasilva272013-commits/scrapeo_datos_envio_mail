# 🚀 LeadFlow — Setup Guide

App web que replica exactamente los 2 workflows de n8n, sin base de datos.
La única fuente de verdad es tu Google Sheets.

---

## Prerequisitos

- Node.js 18+
- Una cuenta Google
- API Key de OpenAI (gpt-4.1)
- API Key de Google Places

---

## 1. Clonar e instalar

```bash
cd leadflow
npm install
```

---

## 2. Crear proyecto en Google Cloud Console

1. Ir a https://console.cloud.google.com
2. Crear un proyecto nuevo
3. Habilitar estas APIs:
   - **Google Sheets API**
   - **Google Drive API**
   - **Gmail API**
   - **Places API (New)** — para el scrapeo de Google Maps
4. Ir a **Credenciales → Crear credenciales → ID de cliente OAuth 2.0**
   - Tipo: Aplicación web
   - URIs de redireccionamiento autorizados: `http://localhost:3000/api/auth/callback/google`
5. Copiar `Client ID` y `Client Secret`

---

## 3. Configurar .env.local

Editar el archivo `.env.local` con tus valores:

```env
GOOGLE_CLIENT_ID=tu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_google_client_secret_aqui
NEXTAUTH_SECRET=cualquier_string_random_largo
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
GOOGLE_PLACES_API_KEY=AIza...
```

Para generar `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## 4. Correr en desarrollo

```bash
npm run dev
```

Abrir http://localhost:3000

---

## 5. Flujo de uso

1. **Login** con Google → autorizar Sheets + Drive + Gmail
2. **Dashboard** → elegir/crear tu Spreadsheet
3. **Configuración** → country, city, niche, firma, emails por día
4. **Prompts** → editar Prompt A (scrapeo) y Prompt B (icebreaker)
5. **Scrapear ahora** → ejecuta Workflow A
6. **Enviar ahora** → ejecuta Workflow B
7. **Leads** → ver tabla, filtrar, exportar XLSX

---

## Estructura de la Spreadsheet

La app usa 4 pestañas:

| Tab | Contenido |
|-----|-----------|
| `LEADS` | Web, Correo, Correo Icebreaker, Estado, Fecha Scrapeo, Fecha Envío, Ultimo Error |
| `CONFIG` | Clave-valor con toda la configuración |
| `PROMPTS` | PROMPT_A y PROMPT_B editables |
| `LOGS` | Historial de ejecuciones |

---

## Criterios de Aceptación ✅

- [ ] "Scrapear ahora" escribe filas en Sheet con Estado="Sin enviar" + Fecha Scrapeo
- [ ] "Enviar ahora" toma solo Estado="Sin enviar", envía, actualiza Estado="Enviado" + Fecha Envío
- [ ] El límite de emails por ejecución funciona (equivale al nodo Limit del JSON)
- [ ] Deduplicación de URLs (por websiteUri) y emails funciona
- [ ] Filter de URLs basura (schema, google, gstatic, whatsapp...) funciona
- [ ] Extracción de colores de la web del prospecto funciona
- [ ] Página Leads muestra lo mismo que la Sheet
- [ ] Exportar XLSX funciona
- [ ] Prompts A y B son editables desde UI y persisten en la Sheet

---

## Mapeo nodo n8n → módulo

Ver el archivo `ARCHITECTURE.md` para el detalle completo.
