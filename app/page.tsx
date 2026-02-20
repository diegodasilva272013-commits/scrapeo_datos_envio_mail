import { redirect } from 'next/navigation'

export default async function Home() {
  // Bypass auth para testing — va directo al dashboard
  redirect('/dashboard')
}
