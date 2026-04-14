import { NextResponse } from 'next/server';
import { auth, getRoleFromAccessToken } from '@/auth';
import { isStaffRole } from '@/shared/constants';

export default auth((req) => {
  const isDashboardRoute = req.nextUrl.pathname.startsWith('/dashboard');

  if (!isDashboardRoute) {
    return NextResponse.next();
  }

  if (!req.auth?.user?.id) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = getRoleFromAccessToken(req.auth?.accessToken);
  if (!isStaffRole(role)) {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
