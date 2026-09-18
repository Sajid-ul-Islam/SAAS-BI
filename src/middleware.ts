import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { extractTenantIdFromJwtClaims } from './lib/auth-utils';

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    // Check if real Supabase credentials are configured
    const isSupabaseConfigured =
      Boolean(rawUrl) &&
      Boolean(rawAnonKey) &&
      rawUrl !== '' &&
      rawAnonKey !== '' &&
      !rawUrl?.includes('example.supabase.co') &&
      rawAnonKey !== 'dummy-anon-key' &&
      rawAnonKey !== 'dummy-anon-key-for-building';

    let user: any = null;

    if (isSupabaseConfigured) {
      try {
        const formattedUrl =
          rawUrl!.startsWith('http://') || rawUrl!.startsWith('https://')
            ? rawUrl!
            : `https://${rawUrl}`;

        type CookieToSet = {
          name: string;
          value: string;
          options?: Parameters<typeof response.cookies.set>[2];
        };

        const supabase = createServerClient(formattedUrl, rawAnonKey!, {
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

        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          user = data.user;
        }
      } catch (authError) {
        // Suppress auth network error to avoid Edge 500 crash; treat as unauthenticated
        user = null;
      }
    }

    const demoCookie = request.cookies.get('demo-session');
    const isDemoAuthenticated = demoCookie?.value === 'true';
    const isAuthenticated = Boolean(user) || isDemoAuthenticated;

    const pathname = request.nextUrl.pathname;

    const isPublicAuthRoute =
      pathname === '/' ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/invite') ||
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/api/health') ||
      pathname.startsWith('/api/billing/ipn') ||
      pathname.startsWith('/api/inngest');

    // Protect /dashboard and other tenant routes
    if (!isAuthenticated && !isPublicAuthRoute) {
      // If not authenticated, redirect to /login
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If user is already authenticated and visits login/signup, redirect to dashboard
    if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
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
  } catch (fatalMiddlewareError) {
    // Top-level failsafe: never crash Edge middleware with 500
    // eslint-disable-next-line no-console
    console.error('Middleware caught unexpected error, passing request through:', fatalMiddlewareError);
    return NextResponse.next();
  }
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
