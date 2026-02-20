import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'LeadFlow — Areté Soluciones',
  description: 'Prospección inteligente con IA. Scrapeo y envío de emails personalizados.',
  icons: {
    icon: '/logo-white.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
