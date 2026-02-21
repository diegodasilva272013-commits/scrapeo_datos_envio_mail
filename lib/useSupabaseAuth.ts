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
      }
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

/** Headers con el Google access token para llamadas a API routes */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('google_access_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}
