import { NextResponse } from 'next/server';
import { auth, getRoleFromAccessToken } from '@/auth';
import { isCustomerRole, isStaffRole } from '@/shared/constants';

/**
 * Protected route groups:
 *
 * Staff dashboard  → /dashboard/*
 *   Requires: authenticated + (staff or customer role)
 *
 * Customer routes  → /cart/*, /checkout/*, /my-orders/*, /profile/*,
 *                    /wishlist/*, /customer-dashboard/*
 *   Requires: authenticated (any valid role)
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isStaffDashboardRoute = pathname.startsWith('/dashboard');

  const isCustomerProtectedRoute =
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/my-orders') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/wishlist') ||
    pathname.startsWith('/customer-dashboard');

  // Allow public routes through without any check
  if (!isStaffDashboardRoute && !isCustomerProtectedRoute) {
    return NextResponse.next();
  }

  // All protected routes require authentication
  if (!req.auth?.user?.id) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Staff dashboard additionally requires a recognised role
  if (isStaffDashboardRoute) {
    const role = getRoleFromAccessToken(req.auth?.accessToken);
    if (!isStaffRole(role) && !isCustomerRole(role)) {
      return NextResponse.redirect(new URL('/', req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/customer-dashboard/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/my-orders/:path*',
    '/profile/:path*',
    '/wishlist/:path*',
  ],
};
