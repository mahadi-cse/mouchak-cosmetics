import { redirect } from 'next/navigation';
import { auth, getRoleFromAccessToken } from '@/auth';
import { isCustomerRole, isStaffRole } from '@/shared/constants';
import { CustomerDashboardView } from '@/modules/customer-dashboard';
import { DashboardLocaleProvider, DashboardPageView } from '@/modules/dashboard';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id || session.error) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const role = getRoleFromAccessToken(session.accessToken);
  if (isCustomerRole(role)) {
    return <CustomerDashboardView />;
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
