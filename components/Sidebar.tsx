'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import { AreteLogo } from './AreteLogo'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: '/leads', label: 'Leads', icon: IconLeads },
  { href: '/config', label: 'Configuración', icon: IconConfig },
  { href: '/prompts', label: 'Prompts IA', icon: IconPrompts },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="w-64 min-h-screen bg-surface border-r border-border flex flex-col">

      {/* ── Logo ── */}
      <div className="px-5 py-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <AreteLogo size={36} variant="icon" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-bold text-text tracking-tight">Areté</span>
            <span className="font-mono text-[9px] text-accent tracking-[0.2em] uppercase mt-0.5">LeadFlow</span>
          </div>
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active ? 'bg-accent/15 text-accent border border-accent/25' : 'text-text-dim hover:text-text hover:bg-surface-2'
              }`}>
              <Icon size={18} active={active} />
              <span className="font-body">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── API Keys ── */}
      <div className="px-4 pb-3 border-t border-border pt-3">
        <Link href="/setup"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            pathname === '/setup' ? 'bg-accent/15 text-accent border border-accent/25' : 'text-muted hover:text-text hover:bg-surface-2'
          }`}>
          <IconKey size={18} active={pathname === '/setup'} />
          <span className="font-body">API Keys</span>
        </Link>
      </div>

      {/* ── Usuario ── */}
      {session?.user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            {session.user.image && <Image src={session.user.image} alt="avatar" width={32} height={32} className="rounded-full" />}
            <div className="flex-1 min-w-0">
              <p className="text-text text-sm font-medium truncate font-body">{session.user.name}</p>
              <p className="text-muted text-xs truncate font-mono">{session.user.email}</p>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full text-left text-muted hover:text-danger text-xs font-mono transition-colors">
            Cerrar sesión →
          </button>
        </div>
      )}
    </aside>
  )
}

function IconDashboard({ size = 18, active = false }) {
  const c = active ? '#6366f1' : 'currentColor'
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
}
function IconLeads({ size = 18, active = false }) {
  const c = active ? '#6366f1' : 'currentColor'
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function IconConfig({ size = 18, active = false }) {
  const c = active ? '#6366f1' : 'currentColor'
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
}
function IconPrompts({ size = 18, active = false }) {
  const c = active ? '#6366f1' : 'currentColor'
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
}
function IconKey({ size = 18, active = false }) {
  const c = active ? '#6366f1' : 'currentColor'
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
}
