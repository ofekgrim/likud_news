import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Login page is always accessible
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }
  // Note: JWT check happens client-side since tokens are in localStorage
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
