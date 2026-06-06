import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible auth config — no Node.js APIs (no bcrypt, no mongoose).
 * Used by middleware.ts which runs in the Edge Runtime.
 * lib/auth.ts imports this and extends it with full providers + DB callbacks.
 */
export const authConfig = {
  secret:    process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [],
  pages:     { signIn: '/login' },
  session:   { strategy: 'jwt' as const },
  callbacks: {
    session({ session, token }: any) {
      if (session.user) {
        session.user.role = (token as any).role ?? 'user';
        session.user.id   = (token as any).id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
