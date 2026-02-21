import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('sb-access-token')?.value
  const isAuth = req.nextUrl.pathname.startsWith('/dashboard') || 
                 req.nextUrl.pathname.startsWith('/leads') ||
                 req.nextUrl.pathname.startsWith('/config') ||
                 req.nextUrl.pathname.startsWith('/prompts')

  if (isAuth && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/leads/:path*', '/config/:path*', '/prompts/:path*'],
}
