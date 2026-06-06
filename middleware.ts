import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

// Lightweight Edge-compatible auth — reads JWT cookie without hitting the DB
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Dine-in removed — redirect to home
  if (pathname.startsWith('/dine-in')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const session = req.auth;
  const role    = (session?.user as any)?.role;

  // Admin routes: require admin role
  if (pathname.startsWith('/admin')) {
    if (!session || role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // User dashboard: require any authenticated session
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/dine-in', '/dine-in/:path*'],
};
