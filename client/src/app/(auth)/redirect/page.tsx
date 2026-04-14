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
  if (!session?.user?.id) {
    redirect('/login');
  }

  const role = getRoleFromAccessToken(session.accessToken);

  if (isCustomerRole(role)) {
    redirect('/dashboard');
  }

  if (isStaffRole(role)) {
    redirect(safeCallbackUrl || '/dashboard');
  }

  redirect('/');
}
