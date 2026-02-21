'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // 1. Extract provider_token (Google) from hash before Supabase consumes it
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const providerToken = params.get('provider_token')
      if (providerToken) {
        localStorage.setItem('google_access_token', providerToken)
      }
    }

    // 2. Let Supabase handle session from URL automatically (detectSessionInUrl: true)
    //    Then listen for the session event to redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
      } else if (event === 'INITIAL_SESSION' && !session) {
        // No session after init → go to login
        setTimeout(() => router.push('/login'), 500)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return <p style={{color:'white',padding:40}}>Entrando...</p>
}
