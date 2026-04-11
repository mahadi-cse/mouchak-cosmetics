import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isStaffRole } from '@/shared/constants';
import DashboardPageClient from './DashboardPageClient';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard');
  }

  if (!isStaffRole(session.user.role)) {
    redirect('/');
  }

  return <DashboardPageClient />;
}