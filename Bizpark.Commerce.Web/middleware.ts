import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant');
  if (tenant) {
    // Persist the tenant ID in a cookie so SSR (layout + page) can read it
    const response = NextResponse.next();
    response.cookies.set('bizpark_tenant', tenant, {
      path: '/',
      maxAge: 60 * 60, // 1 hour
      sameSite: 'lax',
      httpOnly: false,
    });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
