import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Pass through freely while allowing header modifications or session checks
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
