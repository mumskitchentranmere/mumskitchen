'use client';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useCartStore } from '@/lib/cartStore';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Rehydrate persisted cart on client mount
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
