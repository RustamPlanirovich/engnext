import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware must be exported as a default function
export default function middleware(request: NextRequest) {
  // In Next.js 13+, middleware should be stateless and not perform file operations
  // We'll handle initialization in a different way
  return NextResponse.next();
}

// Configure which paths this middleware will run on
export const config = {
  matcher: '/api/:path*',
};
