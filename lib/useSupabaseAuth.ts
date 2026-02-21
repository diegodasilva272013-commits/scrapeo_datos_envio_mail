'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

// Key where Supabase stores auth in localStorage
const SUPABASE_STORAGE_KEY = 'sb-hvpvjjaobcaykolxtdhz-auth-token'

function hasStoredSession(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return !!parsed?.access_token
  } catch {
    return false
  }
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Evitamos llamar getSession() de entrada para no disparar 401 cuando no hay sesión.
    // Con flowType implicit, Supabase emite INITIAL_SESSION en cuanto monta.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(SUPABASE_STORAGE_KEY)
        localStorage.removeItem('google_access_token')
        localStorage.removeItem('supabase_access_token')
      }
      if (session?.access_token) {
        localStorage.setItem('supabase_access_token', session.access_token)
      }
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

/** Headers con Google access token + Supabase JWT para llamadas a API routes */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const google = localStorage.getItem('google_access_token')
  const sb = localStorage.getItem('supabase_access_token')
  const headers: Record<string, string> = {}
  if (google) headers['Authorization'] = `Bearer ${google}`
  if (sb) headers['x-sb-token'] = sb
  return headers
}
