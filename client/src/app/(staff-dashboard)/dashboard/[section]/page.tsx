import { redirect } from 'next/navigation';
import { auth, getRoleFromAccessToken } from '@/auth';
import { isCustomerRole, isStaffRole } from '@/shared/constants';
import DashboardPageClient from '../DashboardPageClient';
import { DashboardLocaleProvider } from '@/modules/dashboard';

export default async function DashboardSectionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const role = getRoleFromAccessToken(session.accessToken);
  if (isCustomerRole(role)) {
    redirect('/dashboard');
  }

  if (!isStaffRole(role)) {
    redirect('/');
  }

  return (
    <DashboardLocaleProvider>
      <DashboardPageClient />
    </DashboardLocaleProvider>
  );
}
