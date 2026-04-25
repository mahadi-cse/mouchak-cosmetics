import { redirect } from 'next/navigation';
import { auth, getRoleFromAccessToken } from '@/auth';
import { isCustomerRole, isStaffRole } from '@/shared/constants';

export default async function StaffDashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/login?callbackUrl=/dashboard');
	}

	const role = getRoleFromAccessToken(session.accessToken);
	if (!isStaffRole(role) && !isCustomerRole(role)) {
		redirect('/');
	}

	return <>{children}</>;
}