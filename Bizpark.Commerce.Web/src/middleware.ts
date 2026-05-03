import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tenant = searchParams.get('tenant');

  if (tenant) {
    // Inject into request headers so server components see it in the SAME request
    const requestHeaders = new Headers(request.headers);
    const existing = request.headers.get('cookie') || '';
    const withTenant = `bizpark_tenant=${tenant}${existing ? `; ${existing}` : ''}`;
    requestHeaders.set('cookie', withTenant);

    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // Also set as a real cookie so future requests (without ?tenant=) persist it
    response.cookies.set('bizpark_tenant', tenant, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
