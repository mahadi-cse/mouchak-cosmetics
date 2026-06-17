import { redirect } from 'next/navigation';
import { auth, getRoleFromAccessToken } from '@/auth';
import { isCustomerRole, isStaffRole } from '@/shared/constants';

interface RedirectPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const getSafeCallbackUrl = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  if (value === '/redirect' || value === '/auth/redirect') {
    return null;
  }

  return value;
};

export default async function AuthRedirectPage({ searchParams }: RedirectPageProps) {
  const params = await searchParams;
  const callbackParam = params.callbackUrl;
  const callbackUrl = Array.isArray(callbackParam) ? callbackParam[0] : callbackParam;
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl);

  const session = await auth();

  // If there's a session error (e.g. RefreshAccessTokenError, MissingRefreshToken)
  // the session callback returns {} (empty), so user.id will be falsy.
  // Redirecting back to /login?callbackUrl=/dashboard causes an infinite loop
  // because the client-side SessionProvider still reports "authenticated".
  // Instead, redirect to /login WITHOUT a callbackUrl so there's no loop.
  if (!session?.user?.id) {
    redirect('/login');
  }

  const role = getRoleFromAccessToken(session.accessToken);

  if (isCustomerRole(role)) {
    redirect(safeCallbackUrl || '/dashboard');
  }

  if (isStaffRole(role)) {
    redirect(safeCallbackUrl || '/dashboard');
  }

  redirect('/');
}
