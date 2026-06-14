import { redirect } from 'next/navigation';
import { auth, getRoleFromAccessToken } from '@/auth';
import { isCustomerRole, isStaffRole } from '@/shared/constants';
import { DashboardPageView, DashboardLocaleProvider } from '@/modules/dashboard';

export default async function DashboardSectionPage() {
  const session = await auth();

  if (!session?.user?.id || session.error) {
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
      <DashboardPageView />
    </DashboardLocaleProvider>
  );
}
