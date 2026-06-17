import { redirect } from 'next/navigation';
import { auth, getRoleFromAccessToken } from '@/auth';
import { isCustomerRole, isStaffRole } from '@/shared/constants';

export default async function StaffDashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();

	// If session has an error (e.g. RefreshAccessTokenError) the session callback
	// returns {} — user.id will be falsy. DO NOT bounce back with callbackUrl=/dashboard
	// because the client-side SessionProvider still sees "authenticated" until
	// AuthSessionWatcher finishes signOut, creating an infinite redirect loop.
	if (!session?.user?.id || session.error) {
		redirect('/login');
	}

	const role = getRoleFromAccessToken(session.accessToken);
	if (!isStaffRole(role) && !isCustomerRole(role)) {
		redirect('/');
	}

	return <>{children}</>;
}