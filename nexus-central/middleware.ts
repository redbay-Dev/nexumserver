import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMITS = {
  '/api/company/validate': { requests: 10, windowMs: 60 * 1000 }, // 10 per minute
  '/api/updates/check': { requests: 60, windowMs: 60 * 60 * 1000 }, // 60 per hour
  '/api/updates/download': { requests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  default: { requests: 100, windowMs: 60 * 1000 } // 100 per minute
};

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }
  
  // Get client IP
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Find matching rate limit rule
  const path = request.nextUrl.pathname;
  let rateLimit = RATE_LIMITS.default;
  
  for (const [route, limit] of Object.entries(RATE_LIMITS)) {
    if (route !== 'default' && path.startsWith(route)) {
      rateLimit = limit;
      break;
    }
  }
  
  // Create rate limit key
  const key = `${ip}:${path}`;
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = rateLimitMap.get(key);
  
  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + rateLimit.windowMs };
    rateLimitMap.set(key, entry);
  }
  
  // Check rate limit
  if (entry.count >= rateLimit.requests) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(rateLimit.requests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
        }
      }
    );
  }
  
  // Increment counter
  entry.count++;
  
  // Add rate limit headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(rateLimit.requests));
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.requests - entry.count));
  response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    const cutoff = now - 60 * 60 * 1000; // 1 hour ago
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < cutoff) {
        rateLimitMap.delete(k);
      }
    }
  }
  
  return response;
}

export const config = {
  matcher: '/api/:path*'
};