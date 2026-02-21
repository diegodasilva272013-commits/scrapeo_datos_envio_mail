'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const provider_token = params.get('provider_token')

      // Guardar el token de Google para llamar a Sheets/Drive/Gmail
      if (provider_token) {
        localStorage.setItem('google_access_token', provider_token)
      }

      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(() => {
          router.push('/dashboard')
        })
      } else {
        router.push('/login')
      }
    } else {
      // Sin hash — intentar getSession por si ya hay sesión
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) router.push('/dashboard')
        else router.push('/login')
      })
    }
  }, [router])
  return <p style={{color:'white',padding:40}}>Entrando...</p>
}
