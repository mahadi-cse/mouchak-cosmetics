import { NextResponse } from 'next/server';
import { auth } from '@/auth';
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

  if (!isStaffRole(req.auth.user.role)) {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
