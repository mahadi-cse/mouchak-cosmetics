import { Suspense } from 'react';
import LoginPageClient from './LoginPageClient';

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackParam = params.callbackUrl;
  const callbackUrl = Array.isArray(callbackParam) ? callbackParam[0] : callbackParam;

  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading login page...</div>}>
      <LoginPageClient callbackUrl={callbackUrl || '/dashboard'} />
    </Suspense>
  );
}
