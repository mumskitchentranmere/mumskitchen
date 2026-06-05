import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Dine-in removed — redirect to home
  if (pathname.startsWith('/dine-in')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const token = await getToken({ req, secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET });

  // Admin pages: must have admin role
  if (pathname.startsWith('/admin')) {
    if (!token || (token as any).role !== 'admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Dashboard: must be logged in
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/dine-in', '/dine-in/:path*'],
};
