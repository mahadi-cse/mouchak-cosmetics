import { redirect } from 'next/navigation';
import { auth, getRoleFromAccessToken } from '@/auth';
import { isStaffRole } from '@/shared/constants';
import DashboardPageClient from './DashboardPageClient';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const role = getRoleFromAccessToken(session.accessToken);
  if (!isStaffRole(role)) {
    redirect('/');
  }

  return <DashboardPageClient />;
}