import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isStaffRole } from '@/shared/constants';

export default async function StaffDashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/login?callbackUrl=/dashboard');
	}

	if (!isStaffRole(session.user.role)) {
		redirect('/');
	}

	return <>{children}</>;
}