'use client';

import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';

function AuthSessionWatcher() {
  const { data: session } = useSession();
  const isSigningOut = useRef(false);

  useEffect(() => {
    if (session?.error && !isSigningOut.current) {
      isSigningOut.current = true;
      
      let callbackUrl = window.location.pathname;
      if (session.error === 'ACCOUNT_DEACTIVATED') {
        callbackUrl = `/login?error=ACCOUNT_DEACTIVATED`;
      } else {
        const isDashboard = 
          window.location.pathname.startsWith('/dashboard') || 
          window.location.pathname.startsWith('/customer/dashboard');
        
        if (isDashboard) {
          callbackUrl = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
        }
      }

      signOut({ callbackUrl }).finally(() => {
        isSigningOut.current = false;
      });
    }
  }, [session]);

  return null;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <AuthSessionWatcher />
      {children}
    </SessionProvider>
  );
}
