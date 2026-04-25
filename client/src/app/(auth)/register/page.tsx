import { Suspense } from 'react';
import RegisterPageClient from './RegisterPageClient';

interface RegisterPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const callbackParam = params.callbackUrl;
  const callbackUrl = Array.isArray(callbackParam) ? callbackParam[0] : callbackParam;

  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading registration page...</div>}>
      <RegisterPageClient callbackUrl={callbackUrl || '/dashboard'} />
    </Suspense>
  );
}
