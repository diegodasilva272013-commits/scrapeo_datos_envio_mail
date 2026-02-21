import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getSupabase } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid', 'email', 'profile',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/gmail.send',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return '/login?error=no_email'
      try {
        const sb = getSupabase()
        if (sb) {
          await (sb.from('usuarios') as any).upsert(
            { email: user.email },
            { onConflict: 'email', ignoreDuplicates: true }
          )
        }
      } catch (e) {
        console.warn('Supabase upsert falló (no crítico):', e)
      }
      return true
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token || ""
        token.refreshToken = account.refresh_token || ""
        token.expiresAt = account.expires_at || 0
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      return session
    },
  },
  pages: { signIn: '/login' },
}

declare module 'next-auth' {
  interface Session { accessToken: string; refreshToken: string }
}
declare module 'next-auth/jwt' {
  interface JWT { accessToken: string; refreshToken: string; expiresAt: number }
}
