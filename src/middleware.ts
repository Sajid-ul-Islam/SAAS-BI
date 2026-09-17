import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { extractTenantIdFromJwtClaims } from './lib/auth-utils';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'dummy-anon-key';

  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof response.cookies.set>[2];
  };

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const demoCookie = request.cookies.get('demo-session');
  const isDemoAuthenticated = demoCookie?.value === 'true';
  const isAuthenticated = Boolean(user) || isDemoAuthenticated;

  const isPublicAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/invite') ||
    request.nextUrl.pathname.startsWith('/auth/callback') ||
    request.nextUrl.pathname.startsWith('/api/webhooks');

  // Protect /dashboard and other tenant routes
  if (!isAuthenticated && !isPublicAuthRoute && request.nextUrl.pathname !== '/') {
    // If not authenticated, redirect to /login
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is already authenticated and visits login/signup, redirect to dashboard
  if (isAuthenticated && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Inject tenant context into request headers if available
  if (user) {
    const tenantId = extractTenantIdFromJwtClaims(user);
    if (tenantId) {
      response.headers.set('x-tenant-id', tenantId);
    }
    response.headers.set('x-user-id', user.id);
  } else if (isDemoAuthenticated) {
    response.headers.set('x-tenant-id', '00000000-0000-0000-0000-000000000001');
    response.headers.set('x-user-id', '00000000-0000-0000-0000-000000000001');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
