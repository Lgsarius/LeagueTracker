import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/patch-notes') {
    const response = NextResponse.next();
    
    // Add cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=3600');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=3600');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=3600');
    
    return response;
  }
  
  return NextResponse.next();
} 