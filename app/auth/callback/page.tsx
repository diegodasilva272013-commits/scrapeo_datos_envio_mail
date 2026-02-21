'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function AuthCallback() {
  const router = useRouter()
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) router.push('/dashboard')
      else router.push('/login')
    })
  }, [router])
  return <p style={{color:'white',padding:40}}>Entrando...</p>
}
