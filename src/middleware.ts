import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/files',
  '/folders',
  '/upload',
  '/settings',
  '/activity',
  '/shares',
  '/shared-with-me',
  '/search',
  '/demo-permissions'
];

// Admin-only routes
const adminRoutes = [
  '/admin',
  '/users',
  '/system-settings'
];

// List of auth routes that should redirect to dashboard if user is already logged in
const authRoutes = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check route types
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // For now, skip authentication checks to allow testing
  // In production, you would check for valid session cookies here
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|share).*)',
  ],
};