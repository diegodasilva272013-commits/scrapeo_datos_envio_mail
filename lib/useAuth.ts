'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

/**
 * Hook de autenticación dual: NextAuth (Google APIs) + Supabase (email/password y Google login).
 * Devuelve el email del usuario autenticado desde cualquiera de los dos proveedores.
 */
export function useAuth() {
  const { data: session, status } = useSession()
  const [sbEmail, setSbEmail] = useState<string | null>(null)
  const [sbChecked, setSbChecked] = useState(false)

  useEffect(() => {
    // Leer cookie no-httpOnly con el email de Supabase
    const match = document.cookie.match(/sb-user-email=([^;]+)/)
    if (match) setSbEmail(decodeURIComponent(match[1]))
    setSbChecked(true)
  }, [])

  const email = session?.user?.email || sbEmail || null
  const isLoading = status === 'loading' || !sbChecked

  return { email, isLoading, session }
}
