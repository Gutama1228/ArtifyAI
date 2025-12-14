import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // ============================================
  // PUBLIC ROUTES (no authentication required)
  // ============================================
  const publicRoutes = ['/', '/login', '/register', '/verify-email', '/forgot-password'];
  const isPublicRoute = publicRoutes.includes(path);

  // ============================================
  // PROTECTED ROUTES (authentication required)
  // ============================================
  const protectedPrefixes = ['/dashboard', '/chat', '/gallery', '/settings'];
  const isProtectedRoute = protectedPrefixes.some(prefix => path.startsWith(prefix));

  // ============================================
  // ADMIN ROUTES (admin/moderator role required)
  // ============================================
  const isAdminRoute = path.startsWith('/admin');

  // ============================================
  // ROUTE LOGIC
  // ============================================

  // If user is NOT logged in and tries to access protected route
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(redirectUrl);
  }

  // If user IS logged in and tries to access auth pages (login/register)
  if (user && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user tries to access admin routes
  if (isAdminRoute) {
    // First check if user is logged in
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Then check if user has admin/moderator role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
      // Not an admin - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

// ============================================
// MATCHER CONFIGURATION
// ============================================
// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
