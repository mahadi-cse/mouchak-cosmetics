import { NextResponse } from 'next/server';
import { auth, getRoleFromAccessToken } from '@/auth';
import { isCustomerRole, isStaffRole } from '@/shared/constants';

export default auth((req) => {
  const isStaffDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard');
  const isCustomerDashboardRoute = req.nextUrl.pathname.startsWith('/customer-dashboard');

  if (!isStaffDashboardRoute && !isCustomerDashboardRoute) {
    return NextResponse.next();
  }

  if (isCustomerDashboardRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  if (!req.auth?.user?.id) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', '/dashboard');
    return NextResponse.redirect(loginUrl);
  }

  const role = getRoleFromAccessToken(req.auth?.accessToken);
  if (isStaffDashboardRoute && !isStaffRole(role) && !isCustomerRole(role)) {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/customer-dashboard/:path*'],
};
